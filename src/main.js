const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, shell, desktopCapturer, clipboard, nativeImage, dialog } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile, execSync, spawn: spawnProcess } = require('child_process');
const http = require('http');
const https = require('https');
const net = require('net');
const dns = require('dns');

// Simple HTTP GET (for ip-api.com which is HTTP-only free tier)
function httpGet(url) {
  return new Promise((resolve) => {
    http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null))
      .on('timeout', function() { this.destroy(); resolve(null); });
  });
}

// GPU startup — don't disable vsync to avoid wasting GPU cycles
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// ── Auto-installer ──────────────────────────────────────────────────
// When running from outside AppData\Local\Kairozun (e.g. Downloads),
// copies the app to AppData, creates shortcuts, and relaunches.
function writeUninstallScript(filePath) {
  const script = [
    '$ErrorActionPreference = "SilentlyContinue"',
    '$AppName = "Kairozun"',
    'Remove-Item "$env:LOCALAPPDATA\\$AppName" -Recurse -Force',
    'Remove-Item "$([Environment]::GetFolderPath(\'Desktop\'))\\$AppName.lnk" -Force',
    'Remove-Item "$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs\\$AppName" -Recurse -Force',
    'Write-Host "Kairozun has been uninstalled."',
    'pause',
  ].join('\r\n');
  try { fs.writeFileSync(filePath, script, 'utf8'); } catch { /* ignore */ }
}

function ensureInstalled() {
  if (!app.isPackaged) return; // skip in dev mode

  const appName = 'Kairozun';
  const installDir = path.join(process.env.LOCALAPPDATA, appName);
  const currentExe = process.execPath;
  const currentDir = path.dirname(currentExe);
  const installedExe = path.join(installDir, path.basename(currentExe));

  // Normalize paths for case-insensitive comparison
  const normCurrent = path.normalize(currentExe).toLowerCase();
  const normInstallPrefix = (path.normalize(installDir) + path.sep).toLowerCase();

  // Already running from install directory — just ensure uninstall script exists
  if (normCurrent.startsWith(normInstallPrefix)) {
    const uninstallPath = path.join(installDir, 'uninstall.ps1');
    if (!fs.existsSync(uninstallPath)) writeUninstallScript(uninstallPath);
    return;
  }

  // Running from outside (Downloads, etc.) — install or update
  try {
    fs.cpSync(currentDir, installDir, { recursive: true, force: true });
  } catch {
    // Copy failed (files locked = app already running) — fall through to single-instance handler
    return;
  }

  // Write uninstall script
  writeUninstallScript(path.join(installDir, 'uninstall.ps1'));

  // Create shortcuts via PowerShell (temp .ps1 file to avoid escaping issues)
  const desktop = path.join(process.env.USERPROFILE, 'Desktop');
  const startMenuDir = path.join(
    process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', appName
  );
  try { fs.mkdirSync(startMenuDir, { recursive: true }); } catch { /* ignore */ }

  const psScript = [
    '$shell = New-Object -ComObject WScript.Shell',
    '$s = $shell.CreateShortcut("' + path.join(desktop, appName + '.lnk') + '")',
    '$s.TargetPath = "' + installedExe + '"',
    '$s.WorkingDirectory = "' + installDir + '"',
    '$s.Description = "' + appName + '"',
    '$s.Save()',
    '$s2 = $shell.CreateShortcut("' + path.join(startMenuDir, appName + '.lnk') + '")',
    '$s2.TargetPath = "' + installedExe + '"',
    '$s2.WorkingDirectory = "' + installDir + '"',
    '$s2.Description = "' + appName + '"',
    '$s2.Save()',
  ].join('\r\n');

  const tmpPs1 = path.join(os.tmpdir(), 'kairozun-install-shortcuts.ps1');
  try {
    fs.writeFileSync(tmpPs1, psScript, 'utf8');
    execSync('powershell -NoProfile -ExecutionPolicy Bypass -File "' + tmpPs1 + '"', {
      windowsHide: true,
      timeout: 15000,
    });
  } catch { /* shortcut creation is non-critical */ }
  try { fs.unlinkSync(tmpPs1); } catch { /* ignore */ }

  // Launch installed copy and exit current process
  spawnProcess(installedExe, [], { detached: true, stdio: 'ignore' });
  process.exit(0);
}

ensureInstalled();

const ICON_PATH = path.join(__dirname, '..', 'assets', 'icon.ico');

// ── Persistent Settings ─────────────────────────────────────────────
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch { /* ignore */ }
  return null;
}

function saveSettings(settings) {
  try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings)); } catch { /* ignore */ }
}

let savedSettings = null;

// ── Game History ────────────────────────────────────────────────────
const HISTORY_PATH = path.join(app.getPath('userData'), 'game-history.json');
let gameHistory = [];
let currentGameStart = null;
let currentGameUniverseId = null;

// ── Screenshot Metadata ─────────────────────────────────────────────
const SCREENSHOT_META_PATH = path.join(app.getPath('userData'), 'screenshots-meta.json');
let screenshotMeta = {};

function loadScreenshotMeta() {
  try {
    if (fs.existsSync(SCREENSHOT_META_PATH)) {
      const data = JSON.parse(fs.readFileSync(SCREENSHOT_META_PATH, 'utf8'));
      if (data && typeof data === 'object') screenshotMeta = data;
    }
  } catch { screenshotMeta = {}; }
}

function saveScreenshotMeta() {
  try { fs.writeFileSync(SCREENSHOT_META_PATH, JSON.stringify(screenshotMeta)); } catch {}
}

function loadGameHistory() {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      const data = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
      if (Array.isArray(data)) gameHistory = data;
    }
  } catch { gameHistory = []; }
}

function saveGameHistory() {
  try { fs.writeFileSync(HISTORY_PATH, JSON.stringify(gameHistory.slice(0, 50))); } catch {}
}

// ── Single Instance Lock ────────────────────────────────────────────
const gotSingleLock = app.requestSingleInstanceLock();
if (!gotSingleLock) {
  app.quit();
}

let overlayWindow = null;
let settingsWindow = null;
let editorWindow = null;
let editorInitData = null;
let collageWindow = null;
let collageInitData = null;
let tray = null;
let overlayHiddenByUser = false; // track overlay visibility via opacity (not hide/show)

// ── Roblox log reader ───────────────────────────────────────────────
const ROBLOX_LOG_DIR = path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'logs');

let robloxRunning = false;
let robloxInterval = null;
let cachedLogFile = null;
let cachedLogMtime = 0;
let cachedLogSize = 0;
let cachedLogContent = '';
let lastLogDirScan = 0;
let cachedLogList = null;

function findLatestRobloxLog() {
  try {
    if (!fs.existsSync(ROBLOX_LOG_DIR)) return null;
    const now = Date.now();
    // Only rescan directory every 5s — fast enough for responsiveness
    if (!cachedLogList || now - lastLogDirScan > 5000) {
      lastLogDirScan = now;
      cachedLogList = fs.readdirSync(ROBLOX_LOG_DIR)
        .filter(f => f.endsWith('.log'));
    }
    // Only stat the most recent few files instead of all
    const recentFiles = cachedLogList.slice(-10);
    const files = recentFiles
      .map(f => {
        try {
          const full = path.join(ROBLOX_LOG_DIR, f);
          const stat = fs.statSync(full);
          return { path: full, mtime: stat.mtimeMs, size: stat.size };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime);
    if (files.length > 0) {
      const latest = files[0];
      // Only re-read if file changed (path, mtime, or size)
      if (latest.path === cachedLogFile && latest.mtime === cachedLogMtime && latest.size === cachedLogSize) {
        return cachedLogFile; // skip re-read
      }
      cachedLogFile = latest.path;
      cachedLogMtime = latest.mtime;
      cachedLogSize = latest.size;
      cachedLogContent = readLogFull(cachedLogFile);
      return cachedLogFile;
    }
    return null;
  } catch { return null; }
}

let robloxServerIp = null;
let robloxServerPort = null;
let robloxServerJoinTime = null;
let robloxUsername = null;
let robloxUserIdFromLog = null;
let robloxJobIdFromLog = null;
let lastPingMs = null;
let serverRegion = null;
let robloxInGame = false; // true when user is actually in a game server

function parseRobloxLog(text) {
  const data = {};
  // Use last ~40KB for most searches — avoids scanning the full buffer repeatedly
  const tail = text.length > 40000 ? text.slice(-40000) : text;

  // Extract server IP and port from UDMUX Address — search tail only
  const udmuxIdx = tail.lastIndexOf('UDMUX Address');
  if (udmuxIdx !== -1) {
    const udmuxLine = tail.substring(udmuxIdx, udmuxIdx + 120);
    const parts = udmuxLine.match(/UDMUX Address\s*=\s*([\d.]+),\s*Port\s*=\s*(\d+)/);
    if (parts) {
      const newIp = parts[1];
      if (newIp !== robloxServerIp) {
        robloxServerIp = newIp;
        robloxServerPort = parts[2];
        serverRegion = null;
        fetchServerRegion(newIp);
      }
    }
  }

  // Extract server join time — search tail for last occurrence
  const joinTimeIdx = tail.lastIndexOf('game_join_loadtime');
  if (joinTimeIdx !== -1) {
    const lineStart = tail.lastIndexOf('\n', joinTimeIdx) + 1;
    const line = tail.substring(lineStart, joinTimeIdx + 30);
    const tsMatch = line.match(/(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
    if (tsMatch) robloxServerJoinTime = tsMatch[1];
  }

  // Extract userId — search tail for last occurrence
  const uidIdx = tail.lastIndexOf('userid');
  if (uidIdx !== -1) {
    const uidSnippet = tail.substring(uidIdx, uidIdx + 30);
    const m = uidSnippet.match(/userid[\s:=]+(\d+)/i);
    if (m) robloxUserIdFromLog = m[1];
  }

  // Extract username — search once from beginning (appears early in log)
  if (!robloxUsername) {
    const userMatch = text.match(/"UserName"%3a"([^"]+)"/i)
      || text.match(/"UserName"\s*:\s*"([^"]+)"/i);
    if (userMatch) robloxUsername = userMatch[1];
  }

  // Extract display name — search once (cached after first find)
  if (!robloxApiData.displayName) {
    const displayMatch = text.match(/"DisplayName"%3a"([^"]+)"/i)
      || text.match(/"DisplayName"\s*:\s*"([^"]+)"/i);
    if (displayMatch) data.displayName = displayMatch[1];
  }

  // Extract game job/instance ID — search tail for last "Joining game"
  const joiningIdx = tail.lastIndexOf("Joining game '");
  if (joiningIdx !== -1) {
    const joiningLine = tail.substring(joiningIdx, joiningIdx + 120);
    const jm = joiningLine.match(/Joining game '([0-9a-f-]{36})' place (\d+)/i);
    if (jm) {
      robloxJobIdFromLog = jm[1];
      if (jm[2]) robloxPlaceId = jm[2];
    }
  }

  // Extract ping — search only last ~10KB for freshest values
  logPingMs = null;
  const pingTail = text.length > 10000 ? text.slice(-10000) : text;
  const pingPatterns = [
    /STAT_Ping\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    /Stats\.Network\.Ping\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    /averagePingMs["'\s:=]+(\d+(?:\.\d+)?)/i,
    /connectionPing["'\s:=]+(\d+(?:\.\d+)?)/i,
    /DataPing\s*[:=]\s*(\d+(?:\.\d+)?)/i,
    /"ping"\s*:\s*(\d+(?:\.\d+)?)/i,
  ];
  // Search backwards through pingTail for the last match of any pattern
  for (const pat of pingPatterns) {
    const m = pingTail.match(pat);
    if (m) {
      const val = Math.round(parseFloat(m[1]));
      if (val > 0 && val < 5000) { logPingMs = val; break; }
    }
  }

  // Detect in-game state using simple lastIndexOf (much faster than matchAll)
  const lastJoinIdx = Math.max(
    tail.lastIndexOf("Joining game '"),
    tail.lastIndexOf('GameJoinLoadTime'),
    tail.lastIndexOf('game_join_loadtime')
  );
  const lastDiscIdx = Math.max(
    tail.lastIndexOf('Client:Disconnect'),
    tail.lastIndexOf('OnDisconnect')
  );
  if (lastJoinIdx > lastDiscIdx) {
    robloxInGame = true;
  } else if (lastDiscIdx > lastJoinIdx && lastJoinIdx === -1) {
    robloxInGame = false;
  } else if (lastDiscIdx > lastJoinIdx) {
    robloxInGame = false;
  }
  // If neither found, keep previous state (sticky)

  if (robloxUsername) data.username = robloxUsername;
  if (lastPingMs != null) data.ping = lastPingMs;

  return data;
}

// Ping measurement — TCP SYN-ACK RTT to actual game server IP
let pingInterval = null;
let pingTargetIp = null;
let logPingMs = null; // ping parsed from Roblox log

function resolvePingTarget() {
  dns.resolve4('users.roblox.com', (err, addresses) => {
    if (!err && addresses && addresses.length > 0) pingTargetIp = addresses[0];
  });
}

function tcpPing(ip, port, timeout, cb) {
  let done = false;
  const start = process.hrtime.bigint();
  const sock = new net.Socket();
  sock.setTimeout(timeout);
  const finish = (ms) => { if (!done) { done = true; cb(ms); } };
  const measure = () => Math.round(Number(process.hrtime.bigint() - start) / 1e6);
  sock.connect(port, ip, () => {
    finish(measure());
    sock.destroy();
  });
  sock.on('error', (err) => {
    // ECONNREFUSED = got TCP RST — still valid RTT measurement
    if (err.code === 'ECONNREFUSED') finish(measure());
    else finish(null);
    sock.destroy();
  });
  sock.on('timeout', () => { finish(null); sock.destroy(); });
}

function doPing() {
  // 1. Log-parsed ping (most accurate — straight from Roblox client)
  if (logPingMs != null && logPingMs > 0) {
    lastPingMs = logPingMs;
    return;
  }
  // 2. Server API ping (second best — from Roblox servers API)
  if (robloxApiData.serverPing != null && robloxApiData.serverPing > 0) {
    lastPingMs = robloxApiData.serverPing;
    return;
  }
  // 3. TCP ping fallback (least accurate — network-level RTT, not game ping)
  const targets = [];
  if (robloxServerIp) {
    targets.push([robloxServerIp, 443, 800]);
  }
  if (pingTargetIp) targets.push([pingTargetIp, 443, 2000]);
  if (targets.length === 0) { resolvePingTarget(); return; }
  let i = 0;
  const tryNext = () => {
    if (i >= targets.length) return;
    const [ip, port, timeout] = targets[i++];
    tcpPing(ip, port, timeout, (ms) => {
      if (ms != null) lastPingMs = ms;
      else tryNext();
    });
  };
  tryNext();
}

function startPingLoop() {
  if (pingInterval) clearInterval(pingInterval);
  resolvePingTarget();
  setTimeout(doPing, 300);
  pingInterval = setInterval(doPing, 5000);
}

// ── Roblox API ──────────────────────────────────────────────────────
let robloxUserId = null;
let robloxApiData = {};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    }).on('error', () => resolve(null))
      .on('timeout', function() { this.destroy(); resolve(null); });
  });
}

function httpsPost(url, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      timeout: 5000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', function() { this.destroy(); resolve(null); });
    req.write(postData);
    req.end();
  });
}

async function fetchRobloxApi(username) {
  if (!username) return;
  try {
    if (!robloxUserId) {
      const userResp = await httpsPost('https://users.roblox.com/v1/usernames/users', { usernames: [username] });
      if (userResp && userResp.data && userResp.data.length > 0) {
        robloxUserId = userResp.data[0].id;
        robloxApiData.displayName = userResp.data[0].displayName;
        robloxUsername = userResp.data[0].name;
        robloxApiData.username = robloxUsername;
      }
    }
    if (!robloxUserId) return;
    await fetchRobloxApiById(robloxUserId);
  } catch { /* ignore API errors */ }
}

async function fetchRobloxApiById(userId) {
  if (!userId) return;
  try {
    const [avatarResp, friendsResp] = await Promise.all([
      httpsGet(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
      httpsGet(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
    ]);

    if (avatarResp && avatarResp.data && avatarResp.data[0] && avatarResp.data[0].imageUrl) {
      robloxApiData.avatarUrl = avatarResp.data[0].imageUrl;
    }
    if (friendsResp && friendsResp.count != null) {
      robloxApiData.friendsCount = friendsResp.count;
    }
  } catch { /* ignore API errors */ }
}

// ── Friends data (shared with fetchServerPlayerList) ─────────────────
let friendsAvatarCache = {}; // userId -> imageUrl
let lastFriendsAvatarFetch = 0;

let robloxPlaceId = null;
let robloxUniverseId = null;

async function fetchGameInfo() {
  if (!robloxUniverseId) return;
  try {
    const [gameResp, iconResp] = await Promise.all([
      httpsGet(`https://games.roblox.com/v1/games?universeIds=${robloxUniverseId}`),
      httpsGet(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${robloxUniverseId}&size=512x512&format=Png&isCircular=false`),
    ]);
    if (gameResp && gameResp.data && gameResp.data[0]) {
      const g = gameResp.data[0];
      robloxApiData.gameName = g.name;
      robloxApiData.gamePlaying = g.playing;
      robloxApiData.gameMaxPlayers = g.maxPlayers;
      robloxApiData.gameFavorites = g.favoritedCount;
      robloxApiData.gameVisits = g.visits;
      robloxApiData.gameCreated = g.created;
      robloxApiData.gameUpdated = g.updated;
      robloxApiData.gameGenre = g.genre;
      robloxApiData.gameDescription = g.description;
      robloxApiData.gameCreator = g.creator ? g.creator.name : null;
      robloxApiData.gameCreatorType = g.creator ? g.creator.type : null;
      robloxApiData.placeId = robloxPlaceId;
      robloxApiData.universeId = robloxUniverseId;
      // Use rootPlaceId from game API for server matching (more reliable than log placeId)
      if (g.rootPlaceId) robloxPlaceId = String(g.rootPlaceId);
    }
    if (iconResp && iconResp.data && iconResp.data[0]) {
      robloxApiData.gameIcon = iconResp.data[0].imageUrl;
    }
  } catch { /* ignore */ }
}

async function fetchUserPresence() {
  if (!robloxUserId) return;
  try {
    const resp = await httpsPost('https://presence.roblox.com/v1/presence/users', { userIds: [robloxUserId] });
    if (resp && resp.userPresences && resp.userPresences[0]) {
      const p = resp.userPresences[0];
      robloxApiData.presenceType = p.userPresenceType; // 0=offline 1=online 2=in-game 3=in-studio
      robloxApiData.lastLocation = p.lastLocation;
      if (p.gameId) robloxApiData.gameId = p.gameId; // server instance job ID
      // Only use presence API as fallback — log is authoritative (presence has 10-30s delay on game switch)
      if (!robloxPlaceId && p.rootPlaceId) robloxPlaceId = String(p.rootPlaceId);
      if (!robloxUniverseId && p.universeId) robloxUniverseId = String(p.universeId);
      // Presence confirms in-game (helps when log is truncated in large games)
      if (p.userPresenceType === 2 && !robloxInGame) robloxInGame = true;
    }
  } catch { /* ignore */ }
}

async function fetchUserInfo() {
  if (!robloxUserId) return;
  try {
    const resp = await httpsGet(`https://users.roblox.com/v1/users/${robloxUserId}`);
    if (resp) {
      robloxApiData.accountCreated = resp.created;
      robloxApiData.description = resp.description;
      robloxApiData.isBanned = resp.isBanned;
      robloxApiData.hasVerifiedBadge = resp.hasVerifiedBadge;
      if (resp.displayName) robloxApiData.displayName = resp.displayName;
      if (resp.name) {
        robloxUsername = resp.name;
        robloxApiData.username = resp.name;
      }
    }
  } catch { /* ignore */ }
}

async function fetchServerRegion(ip) {
  if (!ip) return;
  try {
    const resp = await httpGet(`http://ip-api.com/json/${ip}?fields=country,city,regionName`);
    if (resp && resp.country) {
      serverRegion = resp.city ? `${resp.city}, ${resp.country}` : resp.country;
    }
  } catch { /* ignore */ }
}

async function fetchGameVotes() {
  if (!robloxUniverseId) return;
  try {
    const resp = await httpsGet(`https://games.roblox.com/v1/games/votes?universeIds=${robloxUniverseId}`);
    if (resp && resp.data && resp.data[0]) {
      const v = resp.data[0];
      robloxApiData.gameUpVotes = v.upVotes;
      robloxApiData.gameDownVotes = v.downVotes;
      const total = v.upVotes + v.downVotes;
      robloxApiData.gameRating = total > 0 ? Math.round((v.upVotes / total) * 100) : null;
    }
  } catch { /* ignore */ }
}

async function fetchFollowersCount() {
  if (!robloxUserId) return;
  try {
    const resp = await httpsGet(`https://friends.roblox.com/v1/users/${robloxUserId}/followers/count`);
    if (resp && resp.count != null) {
      robloxApiData.followersCount = resp.count;
    }
  } catch { /* ignore */ }
}

async function fetchServerPlayers() {
  if (!robloxPlaceId) return;
  try {
    const jobId = robloxJobIdFromLog || robloxApiData.gameId;
    let cursor = '';
    let totalServers = 0;
    let foundOurServer = false;
    let firstServer = null;
    let gotAnyData = false;

    // Search Asc (smaller servers) then Desc (popular servers) to find ours
    // Reduced pages to avoid rate limiting (playerTokens removed, so less data needed)
    for (let page = 0; page < 2; page++) {
      const url = `https://games.roblox.com/v1/games/${robloxPlaceId}/servers/Public?sortOrder=Asc&limit=100${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`;
      const resp = await httpsGet(url);
      if (!resp || !resp.data) break;

      gotAnyData = true;
      totalServers += resp.data.length;

      for (const srv of resp.data) {
        if (!firstServer) firstServer = srv;
        if (jobId && srv.id === jobId) {
          robloxApiData.serverPlayerCount = srv.playing;
          robloxApiData.serverMaxPlayers = srv.maxPlayers;
          if (srv.fps) robloxApiData.serverFps = Math.round(srv.fps);
          if (srv.ping) robloxApiData.serverPing = Math.round(srv.ping);
          foundOurServer = true;
          break;
        }
      }
      if (foundOurServer) break;

      if (resp.nextPageCursor) {
        cursor = resp.nextPageCursor;
      } else break;
    }

    // If not found with Asc, try Desc (most popular servers first) — 1 page
    if (!foundOurServer && jobId) {
      const url2 = `https://games.roblox.com/v1/games/${robloxPlaceId}/servers/Public?sortOrder=Desc&limit=100`;
      const resp2 = await httpsGet(url2);
      if (resp2 && resp2.data) {
        gotAnyData = true;
        totalServers += resp2.data.length;
        for (const srv of resp2.data) {
          if (!firstServer) firstServer = srv;
          if (srv.id === jobId) {
            robloxApiData.serverPlayerCount = srv.playing;
            robloxApiData.serverMaxPlayers = srv.maxPlayers;
            if (srv.fps) robloxApiData.serverFps = Math.round(srv.fps);
            if (srv.ping) robloxApiData.serverPing = Math.round(srv.ping);
            foundOurServer = true;
            break;
          }
        }
      }
    }

    if (gotAnyData) robloxApiData.totalServers = totalServers;

    if (!foundOurServer && firstServer) {
      if (firstServer.fps) robloxApiData.serverFps = Math.round(firstServer.fps);
    }
  } catch { /* ignore */ }
}

// playerTokens were removed from Roblox servers API (returns empty array now).
// fetchPlayerThumbnails is no longer functional — kept as no-op for call compatibility.
async function fetchPlayerThumbnails() { /* Roblox removed playerTokens from servers API */ }

// Fetch server players: own user + friends on same server
// Also builds friendsList for the friends widget (reuses same API calls)
async function fetchServerPlayerList() {
  if (!robloxUserId) return;
  const jobId = robloxJobIdFromLog || robloxApiData.gameId;
  const players = [];

  // 1. Add self
  const selfAvatar = robloxApiData.avatarUrl || null;
  players.push({
    userId: robloxUserId,
    username: robloxUsername || robloxApiData.username || 'You',
    displayName: robloxApiData.displayName || robloxUsername || 'You',
    avatarUrl: selfAvatar,
    isSelf: true,
  });

  // 2. Get friends list, presence, and avatars in one flow
  let allFriends = [];
  try {
    const friendsResp = await httpsGet(`https://friends.roblox.com/v1/users/${robloxUserId}/friends`);
    if (friendsResp && friendsResp.data && friendsResp.data.length > 0) {
      allFriends = friendsResp.data;

      // Debug: log raw friend data once
      if (!fetchServerPlayerList._dbg1) {
        fetchServerPlayerList._dbg1 = true;
        const sample = allFriends[0];
        console.log('[Friends] Raw sample:', JSON.stringify({
          id: sample.id, name: sample.name, isOnline: sample.isOnline,
          presenceType: sample.presenceType, userPresenceType: sample.userPresenceType,
        }));
        console.log('[Friends] Total:', allFriends.length,
          'isOnline=true:', allFriends.filter(f => f.isOnline).length);
      }

      // Try Presence API for accurate online status
      const friendIds = allFriends.map(f => f.id);
      const presenceMap = {}; // userId -> {type, gameId}
      for (let i = 0; i < friendIds.length; i += 100) {
        const batch = friendIds.slice(i, i + 100);
        const presenceResp = await httpsPost('https://presence.roblox.com/v1/presence/users', { userIds: batch });

        // Debug: log presence response once
        if (!fetchServerPlayerList._dbg2) {
          fetchServerPlayerList._dbg2 = true;
          if (presenceResp && presenceResp.userPresences) {
            const online = presenceResp.userPresences.filter(p => p.userPresenceType >= 1);
            console.log('[Friends] Presence API works! Online:', online.length, '/', presenceResp.userPresences.length);
            if (online.length > 0) console.log('[Friends] Online sample:', JSON.stringify(online[0]));
          } else {
            console.log('[Friends] Presence API failed or empty:', JSON.stringify(presenceResp));
          }
        }

        if (presenceResp && presenceResp.userPresences) {
          for (const p of presenceResp.userPresences) {
            presenceMap[p.userId] = { type: p.userPresenceType, gameId: p.gameId };
          }
        }
      }

      const hasPresenceData = Object.keys(presenceMap).length > 0;

      // Fetch avatars for friends (cached — only re-fetch every 5 min)
      const now = Date.now();
      if (now - lastFriendsAvatarFetch >= 300000 || Object.keys(friendsAvatarCache).length === 0) {
        lastFriendsAvatarFetch = now;
        for (let i = 0; i < friendIds.length; i += 100) {
          const batch = friendIds.slice(i, i + 100);
          const thumbResp = await httpsGet(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${batch.join(',')}&size=150x150&format=Png`);
          if (thumbResp && thumbResp.data) {
            for (const t of thumbResp.data) {
              if (t.imageUrl) friendsAvatarCache[t.targetId] = t.imageUrl;
            }
          }
        }
      }

      // Build friendsList for friends widget (online friends only)
      // AND add same-server friends to player list
      const friendsList = [];
      for (const f of allFriends) {
        const presence = presenceMap[f.id];
        // Determine online status: prefer Presence API, fallback to friends endpoint isOnline
        const presType = presence ? presence.type : (f.presenceType || 0);
        const isOnline = hasPresenceData ? (presType >= 1) : (f.isOnline === true);
        const onSameServer = presence && presence.type === 2 && presence.gameId && jobId && presence.gameId === jobId;

        friendsList.push({
          id: f.id,
          username: f.name,
          displayName: f.displayName,
          isOnline,
          presenceType: presType,
          avatarUrl: friendsAvatarCache[f.id] || null,
        });

        // Add to server player list if on same server
        if (onSameServer) {
          players.push({
            userId: f.id,
            username: f.name,
            displayName: f.displayName || f.name,
            avatarUrl: friendsAvatarCache[f.id] || null,
            isFriend: true,
          });
        }
      }
      robloxApiData.friendsList = friendsList;
    }
  } catch (e) {
    console.log('[Friends] Error:', e.message);
  }

  // 3. Fill remaining slots with anonymous placeholders
  const totalOnServer = robloxApiData.serverPlayerCount || 1;
  const knownCount = players.length;
  const remaining = Math.max(0, totalOnServer - knownCount);

  if (remaining > 0) {
    for (let i = 0; i < Math.min(remaining, 20); i++) {
      players.push({
        userId: 'anon-' + i,
        username: 'Player ' + (knownCount + i + 1),
        displayName: 'Player ' + (knownCount + i + 1),
        avatarUrl: null,
        isAnon: true,
      });
    }
  }

  robloxApiData.serverPlayerList = players;
}

// Fetch API data periodically
// Fast loop (4s): game info, presence — for live data
// Server loop (6s): server players — heavier call, separate to avoid rate limits
// Slow loop (30s): user info, votes, followers — rarely change
let apiFastInterval = null;
let apiSlowInterval = null;
let apiServerInterval = null;
let apiFastBusy = false;
let apiServerBusy = false;
let apiSlowBusy = false;
let lastInGameState = false; // track in-game transition for immediate fetch

async function doImmediateFullFetch() {
  // Called once when transitioning to in-game state
  if (!robloxUserId && !robloxUsername) return;
  try {
    if (!robloxUserId && robloxUsername) await fetchRobloxApi(robloxUsername);
    if (!robloxUserId && robloxUserIdFromLog) {
      robloxUserId = parseInt(robloxUserIdFromLog);
      await fetchRobloxApiById(robloxUserId);
    }
    // Fetch avatar immediately if not yet loaded
    if (!robloxApiData.avatarUrl && robloxUserId) {
      await fetchRobloxApiById(robloxUserId);
    }
    // Fetch everything in parallel for fastest possible loading
    await Promise.all([
      fetchGameInfo(),
      fetchUserPresence(),
      fetchGameVotes(),
      fetchUserInfo(),
      fetchFollowersCount(),
    ]);
    // Server players + friends list
    if (robloxPlaceId) {
      await fetchServerPlayers();
    }
    await fetchServerPlayerList();
  } catch { /* ignore */ }
}

function startApiLoop() {
  apiFastInterval = setInterval(async () => {
    if (apiFastBusy || !robloxRunning || (!robloxInGame && robloxApiData.presenceType !== 2)) return;
    if (!robloxUserId && !robloxUsername) return;
    apiFastBusy = true;
    try {
      if (!robloxUserId && robloxUsername) await fetchRobloxApi(robloxUsername);
      // Refresh avatar if not yet loaded (first cycles)
      if (!robloxApiData.avatarUrl && robloxUserId) await fetchRobloxApiById(robloxUserId);
      await Promise.all([fetchGameInfo(), fetchUserPresence()]);
    } finally { apiFastBusy = false; }
  }, 4000);
  apiServerInterval = setInterval(async () => {
    if (apiServerBusy || !robloxRunning || (!robloxInGame && robloxApiData.presenceType !== 2)) return;
    apiServerBusy = true;
    try {
      const tasks = [];
      if (robloxPlaceId) {
        tasks.push(fetchServerPlayers(), fetchServerPlayerList());
      } else if (robloxUserId) {
        // No placeId yet but have userId — still fetch friends list
        tasks.push(fetchServerPlayerList());
      }
      if (tasks.length > 0) await Promise.all(tasks);
    } finally { apiServerBusy = false; }
  }, 6000);
  apiSlowInterval = setInterval(async () => {
    if (apiSlowBusy || !robloxRunning || (!robloxInGame && robloxApiData.presenceType !== 2) || !robloxUserId) return;
    apiSlowBusy = true;
    try {
      await fetchRobloxApiById(robloxUserId);
      await Promise.all([fetchGameVotes(), fetchUserInfo(), fetchFollowersCount()]);
    } finally { apiSlowBusy = false; }
  }, 30000);
}

// Cache Roblox PID to avoid calling tasklist every cycle
let robloxPid = null;
let lastProcessCheck = 0;

function checkRobloxRunning(callback) {
  // Fast path: if we have a cached PID, just check if it still exists
  if (robloxPid) {
    try {
      process.kill(robloxPid, 0); // signal 0 = just check existence
      callback(true);
      return;
    } catch {
      robloxPid = null; // process gone, fall through to full check
    }
  }
  // Full check only every 5s when no cached PID
  const now = Date.now();
  if (now - lastProcessCheck < 5000) { callback(false); return; }
  lastProcessCheck = now;
  execFile('tasklist', ['/FI', 'IMAGENAME eq RobloxPlayerBeta.exe', '/FO', 'CSV', '/NH'], {
    windowsHide: true, timeout: 2000,
  }, (err, stdout) => {
    const found = !err && stdout.includes('RobloxPlayerBeta');
    if (found) {
      const m = stdout.match(/"RobloxPlayerBeta\.exe","(\d+)"/i);
      if (m) robloxPid = parseInt(m[1]);
    }
    callback(found);
  });
}

function readLogFull(filePath) {
  try {
    const fd = fs.openSync(filePath, 0x0000);
    const stat = fs.fstatSync(fd);
    // Read only last 128KB instead of 1MB — sufficient for all patterns
    // and drastically reduces CPU load from regex parsing
    const MAX = 128 * 1024;
    const offset = Math.max(0, stat.size - MAX);
    const len = Math.min(stat.size, MAX);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, offset);
    fs.closeSync(fd);
    return buf.toString('utf8');
  } catch { return ''; }
}

function startRobloxWatcher() {
  startPingLoop();
  startApiLoop();
  // Track last sent data to avoid redundant IPC
  let lastSentDataJson = '';
  let watcherTicks = 0;
  let firstFetchTriggered = false;
  const doWatcherTick = () => {
      checkRobloxRunning((running) => {
        robloxRunning = running;
        const robloxData = { running };
        if (running) {
          const logFile = findLatestRobloxLog();
          if (logFile && cachedLogContent) {
            try {
              const text = cachedLogContent;
              const logData = parseRobloxLog(text);
              Object.assign(robloxData, logData);

              // Extract PlaceId/UniverseId — only when in game (prevents re-setting after exit)
              let newUniverseDetected = false;
              // Consider in-game if log says so OR if presence API confirms it
              const effectivelyInGame = robloxInGame || robloxApiData.presenceType === 2;
              if (effectivelyInGame) {
                // Sync robloxInGame flag if presence confirms it but log missed it
                if (!robloxInGame && robloxApiData.presenceType === 2) robloxInGame = true;
              // Use lastIndexOf for placeid/universeid — avoids global regex scan of entire buffer
              const placeIdx = text.lastIndexOf('placeid');
              if (placeIdx === -1) { /* also check capitalized */ }
              const placeIdx2 = Math.max(placeIdx, text.lastIndexOf('PlaceId'), text.lastIndexOf('placeId'));
              if (placeIdx2 !== -1) {
                const placeSnippet = text.substring(placeIdx2, placeIdx2 + 40);
                const m = placeSnippet.match(/placeid[\s:=]+(\d+)/i);
                if (m) robloxPlaceId = m[1];
              }
              const univIdx = Math.max(text.lastIndexOf('universeid'), text.lastIndexOf('UniverseId'), text.lastIndexOf('universeId'));
              if (univIdx !== -1) {
                const univSnippet = text.substring(univIdx, univIdx + 40);
                const m = univSnippet.match(/universeid[\s:=]+(\d+)/i);
                if (m && m[1] !== robloxUniverseId) {
                  // Record previous game session before switching
                  if (currentGameUniverseId && currentGameStart) {
                    const dur = Math.floor((Date.now() - new Date(currentGameStart).getTime()) / 1000);
                    if (dur >= 30) {
                      gameHistory.unshift({
                        gameName: robloxApiData.gameName || 'Unknown',
                        gameIcon: robloxApiData.gameIcon || null,
                        placeId: robloxPlaceId,
                        universeId: currentGameUniverseId,
                        startTime: currentGameStart,
                        duration: dur,
                        serverRegion: serverRegion || null,
                        serverIp: robloxServerIp || null,
                      });
                      if (gameHistory.length > 50) gameHistory.length = 50;
                      saveGameHistory();
                    }
                  }
                  robloxUniverseId = m[1];
                  currentGameUniverseId = m[1];
                  currentGameStart = robloxServerJoinTime || new Date().toISOString();
                  newUniverseDetected = true;
                }
              }
              } // end effectivelyInGame guard

              // User left game but Roblox still running — clear game-specific data
              // Trust log disconnect immediately (presence API updates slowly)
              const confirmedNotInGame = !robloxInGame;
              if (confirmedNotInGame) robloxApiData.presenceType = 0;
              if (confirmedNotInGame && currentGameUniverseId) {
                if (currentGameStart) {
                  const dur = Math.floor((Date.now() - new Date(currentGameStart).getTime()) / 1000);
                  if (dur >= 30) {
                    gameHistory.unshift({
                      gameName: robloxApiData.gameName || 'Unknown',
                      gameIcon: robloxApiData.gameIcon || null,
                      placeId: robloxPlaceId,
                      universeId: currentGameUniverseId,
                      startTime: currentGameStart,
                      duration: dur,
                      serverRegion: serverRegion || null,
                      serverIp: robloxServerIp || null,
                    });
                    if (gameHistory.length > 50) gameHistory.length = 50;
                    saveGameHistory();
                  }
                }
                currentGameUniverseId = null;
                currentGameStart = null;
                robloxServerIp = null;
                robloxServerPort = null;
                robloxServerJoinTime = null;
                serverRegion = null;
                lastPingMs = null;
                logPingMs = null;
                robloxPlaceId = null;
                robloxUniverseId = null;
                robloxJobIdFromLog = null;
                // Keep robloxUserId/robloxUsername — user is still logged in
                // Clear game-specific API data but keep user data
                const keepKeys = ['avatarUrl', 'username', 'displayName', 'friendsCount', 'friendsList',
                  'accountCreated', 'description', 'isBanned', 'hasVerifiedBadge', 'presenceType', 'lastLocation'];
                const kept = {};
                for (const k of keepKeys) {
                  if (robloxApiData[k] != null) kept[k] = robloxApiData[k];
                }
                robloxApiData = kept;
              }

              // Detect in-game transition for immediate data loading
              const currentlyInGame = robloxInGame || robloxApiData.presenceType === 2;
              const justJoinedGame = currentlyInGame && !lastInGameState;

              // First-time API fetch — use userId from log if no username
              if (currentlyInGame && !robloxUserId) {
                if (robloxUserIdFromLog) {
                  robloxUserId = parseInt(robloxUserIdFromLog);
                  if (!firstFetchTriggered) { firstFetchTriggered = true; doImmediateFullFetch(); }
                  else doImmediateFullFetch();
                } else if (robloxUsername) {
                  if (!firstFetchTriggered) { firstFetchTriggered = true; doImmediateFullFetch(); }
                  else doImmediateFullFetch();
                }
              } else if (currentlyInGame && !firstFetchTriggered && robloxUserId) {
                // Trigger immediate fetch on very first tick if we already have userId
                firstFetchTriggered = true;
                doImmediateFullFetch();
              } else if (currentlyInGame && (newUniverseDetected || justJoinedGame)) {
                // New game or fresh join — fetch everything immediately
                doImmediateFullFetch();
              } else if (currentlyInGame && robloxUserId && !robloxApiData.displayName) {
                // Retry: in-game but critical data missing (previous fetch failed)
                doImmediateFullFetch();
              } else if (!currentlyInGame && !robloxUserId && (robloxUserIdFromLog || robloxUsername)) {
                // Roblox running but not in game — still fetch account info
                if (robloxUserIdFromLog) {
                  robloxUserId = parseInt(robloxUserIdFromLog);
                  fetchRobloxApiById(robloxUserId).then(() => fetchUserPresence()).catch(() => {});
                } else if (robloxUsername) {
                  fetchRobloxApi(robloxUsername).then(() => fetchUserPresence()).catch(() => {});
                }
              } else if (!currentlyInGame && robloxUserId && !robloxApiData.displayName) {
                // Retry: not in game but account data missing
                fetchRobloxApiById(robloxUserId).then(() => fetchUserPresence()).catch(() => {});
              }

              lastInGameState = currentlyInGame;

              // Trigger immediate ping on first Roblox detection
              if (currentlyInGame && lastPingMs == null) doPing();
            } catch { /* ignore */ }
          }
          // Send in-game flag to renderer (log is authoritative for disconnect)
          robloxData.inGame = robloxInGame;
          // Merge API data
          Object.assign(robloxData, robloxApiData);
          if (robloxInGame) {
            if (robloxServerIp) robloxData.serverIp = robloxServerIp;
            if (robloxServerPort) robloxData.serverPort = robloxServerPort;
            if (serverRegion) robloxData.serverRegion = serverRegion;
            if (robloxServerJoinTime) robloxData.serverJoinTime = robloxServerJoinTime;
            if (lastPingMs != null) robloxData.ping = lastPingMs;
          }
        } else {
          // Record final game session
          if (currentGameUniverseId && currentGameStart) {
            const dur = Math.floor((Date.now() - new Date(currentGameStart).getTime()) / 1000);
            if (dur >= 30) {
              gameHistory.unshift({
                gameName: robloxApiData.gameName || 'Unknown',
                gameIcon: robloxApiData.gameIcon || null,
                placeId: robloxPlaceId,
                universeId: currentGameUniverseId,
                startTime: currentGameStart,
                duration: dur,
                serverRegion: serverRegion || null,
                serverIp: robloxServerIp || null,
              });
              if (gameHistory.length > 50) gameHistory.length = 50;
              saveGameHistory();
            }
          }
          currentGameUniverseId = null;
          currentGameStart = null;
          robloxServerIp = null;
          robloxServerPort = null;
          robloxServerJoinTime = null;
          serverRegion = null;
          lastPingMs = null;
          logPingMs = null;
          robloxUserId = null;
          robloxPlaceId = null;
          robloxUniverseId = null;
          robloxJobIdFromLog = null;
          robloxPid = null;
          robloxInGame = false;
          lastInGameState = false;
          robloxApiData = {};
          friendsAvatarCache = {};
          lastFriendsAvatarFetch = 0;
        }
        const send = (win) => {
          if (win && !win.isDestroyed()) win.webContents.send('roblox-data', robloxData);
        };
        // Only send if data actually changed (lightweight fingerprint instead of full JSON.stringify)
        const fp = [
          robloxData.running, robloxData.inGame, robloxData.ping,
          robloxData.serverIp, robloxData.gameName, robloxData.username,
          robloxData.serverPlayerCount, robloxData.serverFps,
          robloxData.avatarUrl, robloxData.friendsCount,
          robloxData.gameRating, robloxData.totalServers,
          robloxData.serverRegion, robloxData.followersCount,
          robloxData.serverPlayerList ? robloxData.serverPlayerList.length : 0,
          robloxData.gamePlaying, robloxData.displayName,
          robloxData.presenceType, robloxData.gameIcon,
          robloxData.gameDescription, robloxData.gameCreatorType,
          robloxData.gameMaxPlayers, robloxData.gameUpVotes,
          robloxData.friendsList ? robloxData.friendsList.length : 0,
          robloxData.friendsList ? robloxData.friendsList.filter(f => f.isOnline).length : 0,
        ].join('|');
        if (fp !== lastSentDataJson) {
          lastSentDataJson = fp;
          send(overlayWindow);
          send(settingsWindow);
        }
      });
  };
  // First tick immediately, then 2s for first 60s, then 3s steady
  doWatcherTick();
  robloxInterval = setInterval(() => {
    watcherTicks++;
    doWatcherTick();
    // Switch to 3s interval after ~60s (30 ticks × 2s)
    if (watcherTicks === 30 && robloxInterval) {
      clearInterval(robloxInterval);
      robloxInterval = setInterval(doWatcherTick, 3000);
    }
  }, 2000);
}

function createOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    fullscreenable: true,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayHiddenByUser = false;

  // Periodically re-assert always-on-top — Roblox fullscreen can steal Z-order
  const ontopInterval = setInterval(() => {
    if (!overlayWindow || overlayWindow.isDestroyed()) { clearInterval(ontopInterval); return; }
    overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  }, 3000);
  overlayWindow.on('closed', () => clearInterval(ontopInterval));
}

// Toggle overlay visibility via opacity — avoids show()/hide() which
// disrupts fullscreen apps by changing the window Z-order.
function toggleOverlayVisibility() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  overlayHiddenByUser = !overlayHiddenByUser;
  overlayWindow.setOpacity(overlayHiddenByUser ? 0 : 1);
  overlayWindow.setIgnoreMouseEvents(true, { forward: !overlayHiddenByUser });
}

// ── Screenshot (captures GPU post-processed output incl. NVIDIA filters) ────
const CAPTURE_DIR = path.join(app.getPath('pictures'), 'Kairozun Screenshots');

async function takeScreenshot() {
  try {
    // Hide overlay so it's not captured
    const wasVisible = overlayWindow && !overlayWindow.isDestroyed() && !overlayHiddenByUser;
    if (wasVisible) overlayWindow.setOpacity(0);

    // Minimal wait for compositor (1 frame)
    await new Promise(r => setTimeout(r, 30));

    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const scaleFactor = display.scaleFactor || 1;

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: Math.round(width * scaleFactor), height: Math.round(height * scaleFactor) },
    });

    // Restore overlay, then show flash
    if (wasVisible && overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setOpacity(1);
    }
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('screenshot-taken', '');
    }

    if (sources.length === 0) return;

    const image = sources[0].thumbnail;
    if (image.isEmpty()) return;

    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(CAPTURE_DIR, `Kairozun_${ts}.png`);
    fs.writeFileSync(filePath, image.toPNG());

    // Save game metadata alongside screenshot
    if (robloxApiData.gameIcon || robloxApiData.gameName) {
      const fname = path.basename(filePath);
      screenshotMeta[fname] = {
        gameIcon: robloxApiData.gameIcon || null,
        gameName: robloxApiData.gameName || null,
      };
      saveScreenshotMeta();
    }

    // Notify settings window that a new screenshot was taken
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('screenshot-taken', filePath);
    }
  } catch {
    // Restore overlay on error
    if (overlayWindow && !overlayWindow.isDestroyed() && !overlayHiddenByUser) {
      overlayWindow.setOpacity(1);
    }
  }
}

// ── Screen Recording ────────────────────────────────────────────────
let isRecording = false;

async function toggleRecording() {
  if (isRecording) {
    // Stop recording
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('stop-recording');
    }
    return;
  }

  // Start recording
  try {
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 } });
    if (sources.length === 0) return;

    const sourceId = sources[0].id;
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const duration = (savedSettings && savedSettings.recordingDuration) || 30;
    const quality = (savedSettings && savedSettings.recordingQuality) || 'high';
    const showOverlay = savedSettings && savedSettings.showOnCapture !== undefined ? savedSettings.showOnCapture : true;

    // Hide overlay if user doesn't want it in recording
    if (!showOverlay && overlayWindow && !overlayWindow.isDestroyed() && !overlayHiddenByUser) {
      overlayWindow.setOpacity(0);
    }

    isRecording = true;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('start-recording', { sourceId, width, height, duration, quality, showOverlay });
    }
  } catch { /* ignore */ }
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 720,
    height: 520,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    backgroundColor: '#00000000',
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));

  settingsWindow.webContents.on('did-finish-load', () => {
    if (cachedStaticInfo && settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('system-static', cachedStaticInfo);
    }
  });
}

// ── System metrics ──────────────────────────────────────────────────
let systemInterval = null;

function getCpuUsage() {
  const cpus = os.cpus();
  let totalIdle = 0, totalTick = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) totalTick += cpu.times[type];
    totalIdle += cpu.times.idle;
  }
  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

let prevCpu = getCpuUsage();

// ── CPU Temperature ──────────────────────────────────────────────────
let lastCpuTemp = null;
const TEMP_FILE = path.join(app.getPath('temp'), 'kairozun_cpu_temp.txt');
let tempHelperStarted = false;

function startTempHelper() {
  // Write a helper PS1 script that loops every 5s and writes temp to file
  const ps1Path = path.join(app.getPath('temp'), 'kairozun_temp_helper.ps1');
  const script = `
while ($true) {
  try {
    $max = (Get-CimInstance MSAcpi_ThermalZoneTemperature -Namespace root/WMI -EA Stop | Measure-Object -Property CurrentTemperature -Maximum).Maximum
    if ($max -gt 0) {
      [math]::Round(($max / 10) - 273.15) | Out-File -FilePath '${TEMP_FILE.replace(/\\/g, '\\\\')}' -Encoding ascii -Force
    }
  } catch {
    try {
      $max = (Get-CimInstance Win32_PerfFormattedData_Counters_ThermalZoneInformation -EA Stop | Measure-Object -Property Temperature -Maximum).Maximum
      if ($max -gt 273) {
        [math]::Round($max - 273.15) | Out-File -FilePath '${TEMP_FILE.replace(/\\/g, '\\\\')}' -Encoding ascii -Force
      }
    } catch {}
  }
  Start-Sleep -Seconds 5
}
`;
  try {
    fs.writeFileSync(ps1Path, script);
    // Try elevated first (for MSAcpi access), fall back to normal
    try {
      spawnProcess('powershell', [
        '-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden',
        '-ExecutionPolicy', 'Bypass', '-File', ps1Path
      ], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
    } catch { /* ignore */ }
    tempHelperStarted = true;
  } catch { /* ignore */ }
}

function pollCpuTemp() {
  try {
    if (!fs.existsSync(TEMP_FILE)) return;
    const val = parseInt(fs.readFileSync(TEMP_FILE, 'utf8').trim());
    if (!isNaN(val) && val > 0 && val < 150) lastCpuTemp = val;
  } catch { /* ignore */ }
}

// Start helper and poll
startTempHelper();
setInterval(pollCpuTemp, 5000);
// Also do a direct fallback poll immediately
(function directPoll() {
  execFile('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    "try{(Get-CimInstance Win32_PerfFormattedData_Counters_ThermalZoneInformation -EA Stop|Measure-Object -Property Temperature -Maximum).Maximum}catch{''}"
  ], { timeout: 6000 }, (err, stdout) => {
    if (err || !stdout) return;
    const kelvin = parseInt(stdout.trim());
    if (!isNaN(kelvin) && kelvin > 273) {
      const celsius = Math.round(kelvin - 273.15);
      if (celsius > 0 && celsius < 150 && lastCpuTemp === null) lastCpuTemp = celsius;
    }
  });
})();

// ── Collect static system info once ──────────────────────────────────
let gpuInfo = null;
function getGpuInfo() {
  return new Promise((resolve) => {
    execFile('wmic', ['path', 'win32_VideoController', 'get', 'Name,AdapterRAM', '/value'], { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) return resolve(null);
      const name = (stdout.match(/Name=(.+)/i) || [])[1]?.trim() || null;
      const vramBytes = parseInt((stdout.match(/AdapterRAM=(\d+)/i) || [])[1]) || 0;
      const vramMB = vramBytes ? Math.round(vramBytes / 1048576) : 0;
      resolve({ name, vram: vramMB });
    });
  });
}

function getDiskUsage() {
  return new Promise((resolve) => {
    execFile('wmic', ['logicaldisk', 'where', 'DriveType=3', 'get', 'DeviceID,Size,FreeSpace', '/value'], { timeout: 5000 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      const disks = [];
      const blocks = stdout.split(/\r?\n\r?\n/).filter(b => b.includes('DeviceID'));
      for (const block of blocks) {
        const id = (block.match(/DeviceID=(.+)/i) || [])[1]?.trim();
        const free = parseInt((block.match(/FreeSpace=(\d+)/i) || [])[1]) || 0;
        const size = parseInt((block.match(/Size=(\d+)/i) || [])[1]) || 0;
        if (id && size) disks.push({ drive: id, totalGB: +(size / 1073741824).toFixed(1), freeGB: +(free / 1073741824).toFixed(1) });
      }
      resolve(disks);
    });
  });
}

// Cache static info
let cachedStaticInfo = null;
async function getStaticSystemInfo() {
  if (cachedStaticInfo) return cachedStaticInfo;
  const cpus = os.cpus();
  gpuInfo = await getGpuInfo();
  const disks = await getDiskUsage();
  cachedStaticInfo = {
    cpuModel: cpus[0]?.model?.trim() || 'Unknown',
    cpuCores: cpus.length,
    osVersion: `${os.type()} ${os.release()}`,
    hostname: os.hostname(),
    gpu: gpuInfo,
    disks,
  };
  return cachedStaticInfo;
}

function startSystemMetrics() {
  // Send static info once on start
  getStaticSystemInfo().then(staticInfo => {
    const sendStatic = (win) => {
      if (win && !win.isDestroyed()) win.webContents.send('system-static', staticInfo);
    };
    sendStatic(overlayWindow);
    sendStatic(settingsWindow);
  });

  // Cache totalmem — it never changes
  const cachedTotalMem = os.totalmem();

  systemInterval = setInterval(() => {
    const cur = getCpuUsage();
    const idleDiff = cur.idle - prevCpu.idle;
    const totalDiff = cur.total - prevCpu.total;
    const cpuPercent = totalDiff === 0 ? 0 : Math.round((1 - idleDiff / totalDiff) * 100);
    prevCpu = cur;

    const freeMem = os.freemem();
    const usedMem = cachedTotalMem - freeMem;
    const memPercent = Math.round((usedMem / cachedTotalMem) * 100);

    const metrics = {
      cpu: cpuPercent,
      mem: memPercent,
      cpuTemp: lastCpuTemp,
      totalMemGB: +(cachedTotalMem / 1073741824).toFixed(1),
      usedMemGB: +(usedMem / 1073741824).toFixed(1),
      freeMemGB: +(freeMem / 1073741824).toFixed(1),
      uptime: os.uptime(),
      appMemMB: Math.round(process.memoryUsage.rss() / 1048576),
    };
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('system-metrics', metrics);
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('system-metrics', metrics);
    }
  }, 5000);

  // Network interfaces sent separately every 15s (rarely changes)
  setInterval(() => {
    const nets = os.networkInterfaces();
    const netInfo = [];
    for (const [name, addrs] of Object.entries(nets)) {
      for (const a of addrs) {
        if (!a.internal && a.family === 'IPv4') {
          netInfo.push({ name, ip: a.address });
        }
      }
    }
    const send = (win) => {
      if (win && !win.isDestroyed()) win.webContents.send('system-metrics', { network: netInfo });
    };
    send(overlayWindow);
    send(settingsWindow);
  }, 15000);

  // Refresh disk usage every 60 seconds
  setInterval(async () => {
    const disks = await getDiskUsage();
    if (cachedStaticInfo) cachedStaticInfo.disks = disks;
    const sendDisk = (win) => {
      if (win && !win.isDestroyed()) win.webContents.send('system-disks', disks);
    };
    sendDisk(overlayWindow);
    sendDisk(settingsWindow);
  }, 60000);
}

// ── IPC handlers ────────────────────────────────────────────────────
ipcMain.on('update-settings', (_e, settings) => {
  savedSettings = Object.assign(savedSettings || {}, settings);
  saveSettings(savedSettings);
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('apply-settings', savedSettings);
  }
  // Apply capture mode setting
  // (setContentProtection removed — triggers AV false positives)
});

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
});

ipcMain.on('minimize-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.minimize();
});

// ── Editor Window ──────────────────────────────────────────────────
ipcMain.on('open-editor', (_e, { filePath, fileName, lang }) => {
  if (editorWindow && !editorWindow.isDestroyed()) {
    editorWindow.focus();
    return;
  }
  // Use saved metadata for this screenshot, fall back to current game data
  const meta = screenshotMeta[path.basename(filePath)] || {};
  editorInitData = {
    filePath,
    fileName,
    lang: lang || 'en',
    gameIcon: meta.gameIcon || robloxApiData.gameIcon || null,
    gameName: meta.gameName || robloxApiData.gameName || null,
  };
  editorWindow = new BrowserWindow({
    width: 1200,
    height: 840,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    backgroundColor: '#00000000',
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload-editor.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  editorWindow.loadFile(path.join(__dirname, 'renderer', 'editor.html'));
  editorWindow.on('closed', () => {
    editorWindow = null;
    editorInitData = null;
    // Refresh gallery in settings
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('screenshot-taken', '');
    }
  });
});

ipcMain.on('get-editor-init', (e) => {
  e.returnValue = editorInitData || {};
});

// Import photo from file picker (for editor)
ipcMain.handle('pick-import-photo', async () => {
  const parent = editorWindow && !editorWindow.isDestroyed() ? editorWindow : null;
  const result = await dialog.showOpenDialog(parent, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'bmp', 'webp'] }],
  });
  if (result.canceled || !result.filePaths.length) return null;
  try {
    const buf = fs.readFileSync(result.filePaths[0]);
    return buf.toString('base64');
  } catch { return null; }
});

ipcMain.on('close-editor', () => {
  if (editorWindow && !editorWindow.isDestroyed()) editorWindow.close();
});

// ── Collage Window ──────────────────────────────────────────────────
ipcMain.on('open-collage', (_e, { lang }) => {
  if (collageWindow && !collageWindow.isDestroyed()) {
    collageWindow.focus();
    return;
  }
  collageInitData = { lang: lang || 'en' };
  collageWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    transparent: true,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    fullscreenable: false,
    backgroundColor: '#00000000',
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload-collage.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  collageWindow.loadFile(path.join(__dirname, 'renderer', 'collage.html'));
  collageWindow.on('closed', () => {
    collageWindow = null;
    collageInitData = null;
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('screenshot-taken', '');
    }
  });
});

ipcMain.on('get-collage-init', (e) => {
  e.returnValue = collageInitData || {};
});

ipcMain.on('close-collage', () => {
  if (collageWindow && !collageWindow.isDestroyed()) collageWindow.close();
});

ipcMain.on('get-settings', (e) => {
  e.returnValue = savedSettings;
});

ipcMain.on('get-game-history', (e) => {
  e.returnValue = gameHistory;
});

ipcMain.on('delete-history-entry', (_e, idx) => {
  if (typeof idx === 'number' && idx >= 0 && idx < gameHistory.length) {
    gameHistory.splice(idx, 1);
    saveGameHistory();
  }
});

// ── Player Lookup API ───────────────────────────────────────────────
ipcMain.handle('lookup-player', async (_e, username) => {
  if (!username || typeof username !== 'string') return { error: 'Invalid username' };
  const sanitized = username.trim().slice(0, 20);
  if (!sanitized) return { error: 'Empty username' };
  try {
    // Resolve username to userId
    const userResp = await httpsPost('https://users.roblox.com/v1/usernames/users', { usernames: [sanitized], excludeBannedUsers: false });
    if (!userResp || !userResp.data || userResp.data.length === 0) return { error: 'User not found' };
    const user = userResp.data[0];
    const userId = user.id;

    // Fetch profile, avatar, groups, badges in parallel
    const [profile, avatarResp, groups, friends, followers] = await Promise.all([
      httpsGet(`https://users.roblox.com/v1/users/${userId}`),
      httpsGet(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`),
      httpsGet(`https://groups.roblox.com/v1/users/${userId}/groups/roles`),
      httpsGet(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
      httpsGet(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
    ]);

    const result = {
      userId,
      username: profile ? profile.name : user.name,
      displayName: profile ? profile.displayName : user.displayName,
      created: profile ? profile.created : null,
      description: profile ? (profile.description || '').slice(0, 200) : '',
      isBanned: profile ? profile.isBanned : false,
      hasVerifiedBadge: profile ? profile.hasVerifiedBadge : false,
      avatarUrl: avatarResp && avatarResp.data && avatarResp.data[0] ? avatarResp.data[0].imageUrl : null,
      groups: groups && groups.data ? groups.data.slice(0, 20).map(g => ({
        name: g.group ? g.group.name : '',
        id: g.group ? g.group.id : 0,
        role: g.role ? g.role.name : '',
        memberCount: g.group ? g.group.memberCount : 0,
      })) : [],
      friendsCount: friends && friends.count != null ? friends.count : null,
      followersCount: followers && followers.count != null ? followers.count : null,
    };

    // Fetch game-specific badges if we know the universeId
    if (robloxUniverseId) {
      try {
        const badges = await httpsGet(`https://badges.roblox.com/v1/universes/${robloxUniverseId}/badges?limit=50&sortOrder=Asc`);
        if (badges && badges.data) {
          const badgeIds = badges.data.map(b => b.id);
          if (badgeIds.length > 0) {
            // Check which badges the user has (in batches)
            const owned = [];
            for (let i = 0; i < badgeIds.length; i += 10) {
              const batch = badgeIds.slice(i, i + 10);
              const check = await httpsGet(`https://badges.roblox.com/v1/users/${userId}/badges/awarded-dates?badgeIds=${batch.join(',')}`);
              if (check && check.data) {
                for (const item of check.data) {
                  const badge = badges.data.find(b => b.id === item.badgeId);
                  if (badge) owned.push({ name: badge.name, awardedDate: item.awardedDate });
                }
              }
            }
            result.gameBadges = owned;
            result.totalGameBadges = badges.data.length;
          }
        }
      } catch { /* ignore badge errors */ }
    }

    return result;
  } catch (err) {
    return { error: 'Lookup failed' };
  }
});

// ── Screenshot Gallery IPC ───────────────────────────────────────────
ipcMain.handle('get-screenshots', async () => {
  try {
    if (!fs.existsSync(CAPTURE_DIR)) return [];
    const files = fs.readdirSync(CAPTURE_DIR)
      .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      .map(f => {
        try {
          const full = path.join(CAPTURE_DIR, f);
          const stat = fs.statSync(full);
          return { name: f, path: full, mtime: stat.mtimeMs, size: stat.size };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 100); // limit to 100 most recent
    return files;
  } catch { return []; }
});

ipcMain.handle('read-screenshot', async (_e, filePath) => {
  try {
    // Validate path is inside CAPTURE_DIR to prevent directory traversal
    const resolved = path.resolve(filePath);
    const captureResolved = path.resolve(CAPTURE_DIR);
    if (!resolved.startsWith(captureResolved + path.sep) && resolved !== captureResolved) {
      return null;
    }
    if (!fs.existsSync(resolved)) return null;
    const buf = fs.readFileSync(resolved);
    return buf.toString('base64');
  } catch { return null; }
});

ipcMain.handle('read-screenshot-thumb', async (_e, filePath) => {
  try {
    const resolved = path.resolve(filePath);
    const captureResolved = path.resolve(CAPTURE_DIR);
    if (!resolved.startsWith(captureResolved + path.sep) && resolved !== captureResolved) return null;
    if (!fs.existsSync(resolved)) return null;
    const img = nativeImage.createFromPath(resolved);
    const size = img.getSize();
    if (size.width === 0) return null;
    const thumbW = 240;
    const thumbH = Math.round(size.height * (thumbW / size.width));
    const thumb = img.resize({ width: thumbW, height: thumbH, quality: 'good' });
    return thumb.toJPEG(70).toString('base64');
  } catch { return null; }
});

ipcMain.handle('save-edited-screenshot', async (_e, { base64Data, originalName }) => {
  try {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const ext = path.extname(originalName) || '.png';
    const baseName = path.basename(originalName, ext);
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const newName = `${baseName}_edited_${ts}${ext}`;
    const filePath = path.join(CAPTURE_DIR, newName);
    const buf = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buf);
    // Copy metadata from original screenshot to edited file
    const origMeta = screenshotMeta[path.basename(originalName)];
    if (origMeta) {
      screenshotMeta[newName] = { ...origMeta };
      saveScreenshotMeta();
    }
    // Copy to clipboard for instant paste
    try { clipboard.writeImage(nativeImage.createFromBuffer(buf)); } catch { /* ignore */ }
    return filePath;
  } catch { return null; }
});

ipcMain.handle('delete-screenshot', async (_e, filePath) => {
  try {
    const resolved = path.resolve(filePath);
    const captureResolved = path.resolve(CAPTURE_DIR);
    if (!resolved.startsWith(captureResolved + path.sep)) return false;
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
      // Clean up metadata
      const fname = path.basename(resolved);
      if (screenshotMeta[fname]) {
        delete screenshotMeta[fname];
        saveScreenshotMeta();
      }
      return true;
    }
    return false;
  } catch { return false; }
});

ipcMain.on('open-screenshots-folder', () => {
  fs.mkdirSync(CAPTURE_DIR, { recursive: true });
  shell.openPath(CAPTURE_DIR);
});

// Custom hotkey rebinding
ipcMain.on('set-hotkey', (_e, { action, accelerator }) => {
  try {
    if (action === 'settings') {
      const prev = savedSettings && savedSettings.hotkeySettings ? savedSettings.hotkeySettings : 'Alt+0';
      // Unregister previous first to avoid conflicts
      try { globalShortcut.unregister(prev); } catch { /* ignore */ }
      const ok = globalShortcut.register(accelerator, toggleSettingsWindow);
      if (!ok) {
        // Re-register previous if new one failed
        try { globalShortcut.register(prev, toggleSettingsWindow); } catch { /* ignore */ }
      }
    } else if (action === 'overlay') {
      const prev = savedSettings && savedSettings.hotkeyOverlay ? savedSettings.hotkeyOverlay : 'CommandOrControl+Shift+H';
      const ok = globalShortcut.register(accelerator, () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          toggleOverlayVisibility();
        }
      });
      if (ok) {
        if (accelerator !== prev) {
          try { globalShortcut.unregister(prev); } catch { /* ignore */ }
        }
      }
    } else if (action === 'screenshot') {
      const prev = savedSettings && savedSettings.hotkeyScreenshot ? savedSettings.hotkeyScreenshot : 'F9';
      const ok = globalShortcut.register(accelerator, takeScreenshot);
      if (ok) {
        if (accelerator !== prev) {
          try { globalShortcut.unregister(prev); } catch { /* ignore */ }
        }
      }
    } else if (action === 'recording') {
      const prev = savedSettings && savedSettings.hotkeyRecording ? savedSettings.hotkeyRecording : 'F10';
      const ok = globalShortcut.register(accelerator, toggleRecording);
      if (ok) {
        if (accelerator !== prev) {
          try { globalShortcut.unregister(prev); } catch { /* ignore */ }
        }
      }
    } else if (action === 'quit') {
      const prev = savedSettings && savedSettings.hotkeyQuit ? savedSettings.hotkeyQuit : 'Alt+F4';
      const ok = globalShortcut.register(accelerator, () => { app.isQuiting = true; app.quit(); });
      if (ok) {
        if (accelerator !== prev) {
          try { globalShortcut.unregister(prev); } catch { /* ignore */ }
        }
      }
    }
  } catch { /* ignore invalid accelerator */ }
});

// "Show on capture" toggle — controls whether overlay is visible during recording
ipcMain.on('set-capture-mode', (_e, visible) => {
  // Setting is persisted via updateSettings; used when recording starts
});

// Streaming video recording — write chunks to disk as they arrive (no RAM buildup)
let recordingStream = null;
let recordingFilePath = null;

ipcMain.on('recording-start-file', () => {
  try {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    recordingFilePath = path.join(CAPTURE_DIR, `Kairozun_${ts}.webm`);
    recordingStream = fs.createWriteStream(recordingFilePath);
  } catch { /* ignore */ }
});

ipcMain.on('recording-chunk', (_e, buffer) => {
  try {
    if (recordingStream && !recordingStream.destroyed) {
      recordingStream.write(Buffer.from(buffer));
    }
  } catch { /* ignore */ }
});

ipcMain.on('recording-end-file', () => {
  try {
    if (recordingStream && !recordingStream.destroyed) {
      recordingStream.end();
    }
  } catch { /* ignore */ }
  recordingStream = null;
  recordingFilePath = null;
});

// Legacy fallback (kept for compatibility)
ipcMain.on('save-recording', (_e, buffer) => {
  try {
    fs.mkdirSync(CAPTURE_DIR, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(CAPTURE_DIR, `Kairozun_${ts}.webm`);
    fs.writeFileSync(filePath, Buffer.from(buffer));
  } catch { /* ignore save errors */ }
});

// Recording state update from overlay renderer
ipcMain.on('recording-state', (_e, recording) => {
  isRecording = recording;
  if (!recording && overlayWindow && !overlayWindow.isDestroyed() && !overlayHiddenByUser) {
    overlayWindow.setOpacity(1);
  }
});

// Allow overlay to toggle mouse passthrough for dragging
ipcMain.on('overlay-mouse', (_e, ignore) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (ignore) {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  }
});

// Open external URLs safely
const ALLOWED_URLS = ['https://github.com/skaisay/kairozun', 'https://discord.gg/hR3MHdKAzU'];
ipcMain.on('open-external', (_e, url) => {
  if (ALLOWED_URLS.includes(url)) shell.openExternal(url);
});

// ── App lifecycle ───────────────────────────────────────────────────
app.on('second-instance', () => {
  // Focus existing instance when a second one is launched
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    if (settingsWindow.isMinimized()) settingsWindow.restore();
    settingsWindow.focus();
  } else if (overlayWindow && !overlayWindow.isDestroyed() && overlayHiddenByUser) {
    toggleOverlayVisibility();
  }
});

app.whenReady().then(() => {
  savedSettings = loadSettings();
  loadGameHistory();
  loadScreenshotMeta();
  createOverlay();
  startSystemMetrics();
  startRobloxWatcher();

  // Apply saved settings to overlay after it loads
  if (overlayWindow && savedSettings) {
    overlayWindow.webContents.on('did-finish-load', () => {
      overlayWindow.webContents.send('apply-settings', savedSettings);
    });
  }

  // Tray icon
  tray = new Tray(ICON_PATH);
  tray.setToolTip('Kairozun Overlay');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Settings', click: () => createSettingsWindow() },
    { label: 'Show/Hide Overlay', click: () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        toggleOverlayVisibility();
      }
    }},
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } },
  ]));

  // Validate accelerator — single key or modifier+key combo
  function isValidAccelerator(acc) {
    if (!acc || typeof acc !== 'string') return false;
    const parts = acc.split('+');
    if (parts.length === 0) return false;
    const key = parts[parts.length - 1];
    return /^[A-Z0-9]$/.test(key) || /^F\d{1,2}$/.test(key) ||
      ['Space','Tab','Enter','Backspace','Delete','Insert','Home','End',
       'PageUp','PageDown','Up','Down','Left','Right',
       '-','=','[',']','\\',';',"'",'.','/',
       'num0','num1','num2','num3','num4','num5','num6','num7','num8','num9',
       'nummult','`'].includes(key);
  }

  // Alt+0 — open/close settings (use saved or default)
  let hotkeySettings = savedSettings && savedSettings.hotkeySettings ? savedSettings.hotkeySettings : 'Alt+0';
  if (!isValidAccelerator(hotkeySettings)) hotkeySettings = 'Alt+0';
  let regSettings = false;
  function toggleSettingsWindow() {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      if (settingsWindow.isVisible() && settingsWindow.isFocused()) {
        settingsWindow.close();
      } else {
        settingsWindow.show();
        settingsWindow.focus();
      }
    } else {
      createSettingsWindow();
    }
  }
  try {
    regSettings = globalShortcut.register(hotkeySettings, toggleSettingsWindow);
  } catch { /* invalid accelerator */ }
  if (!regSettings && hotkeySettings !== 'Alt+0') {
    // Fallback to default if custom hotkey failed
    try {
      globalShortcut.register('Alt+0', toggleSettingsWindow);
    } catch { /* ignore */ }
    console.log('[Hotkey] Settings: failed to register', hotkeySettings, '— using Alt+0');
  }

  // Ctrl+Shift+H — toggle overlay visibility (use saved or default)
  let hotkeyOverlay = savedSettings && savedSettings.hotkeyOverlay ? savedSettings.hotkeyOverlay : 'CommandOrControl+Shift+H';
  if (!isValidAccelerator(hotkeyOverlay)) hotkeyOverlay = 'CommandOrControl+Shift+H';
  let regOverlay = false;
  try {
    regOverlay = globalShortcut.register(hotkeyOverlay, () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        toggleOverlayVisibility();
      }
    });
  } catch { /* invalid accelerator */ }
  if (!regOverlay && hotkeyOverlay !== 'CommandOrControl+Shift+H') {
    try {
      globalShortcut.register('CommandOrControl+Shift+H', () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          toggleOverlayVisibility();
        }
      });
    } catch { /* ignore */ }
    console.log('[Hotkey] Overlay: failed to register', hotkeyOverlay, '— using Ctrl+Shift+H');
  }

  // F9 — take screenshot (use saved or default)
  let hotkeyScreenshot = savedSettings && savedSettings.hotkeyScreenshot ? savedSettings.hotkeyScreenshot : 'F9';
  if (!isValidAccelerator(hotkeyScreenshot)) hotkeyScreenshot = 'F9';
  let regScreenshot = false;
  try {
    regScreenshot = globalShortcut.register(hotkeyScreenshot, takeScreenshot);
  } catch { /* invalid accelerator */ }
  if (!regScreenshot && hotkeyScreenshot !== 'F9') {
    try {
      globalShortcut.register('F9', takeScreenshot);
    } catch { /* ignore */ }
    console.log('[Hotkey] Screenshot: failed to register', hotkeyScreenshot, '— using F9');
  }

  // F10 — start/stop screen recording (use saved or default)
  let hotkeyRecording = savedSettings && savedSettings.hotkeyRecording ? savedSettings.hotkeyRecording : 'F10';
  if (!isValidAccelerator(hotkeyRecording)) hotkeyRecording = 'F10';
  let regRecording = false;
  try {
    regRecording = globalShortcut.register(hotkeyRecording, toggleRecording);
  } catch { /* invalid accelerator */ }
  if (!regRecording && hotkeyRecording !== 'F10') {
    try {
      globalShortcut.register('F10', toggleRecording);
    } catch { /* ignore */ }
    console.log('[Hotkey] Recording: failed to register', hotkeyRecording, '- using F10');
  }

  // Quit application hotkey (use saved or default)
  let hotkeyQuit = savedSettings && savedSettings.hotkeyQuit ? savedSettings.hotkeyQuit : 'Alt+F4';
  if (!isValidAccelerator(hotkeyQuit)) hotkeyQuit = 'Alt+F4';
  let regQuit = false;
  try {
    regQuit = globalShortcut.register(hotkeyQuit, () => { app.isQuiting = true; app.quit(); });
  } catch { /* invalid accelerator */ }
  if (!regQuit && hotkeyQuit !== 'Alt+F4') {
    try {
      globalShortcut.register('Alt+F4', () => { app.isQuiting = true; app.quit(); });
    } catch { /* ignore */ }
    console.log('[Hotkey] Quit: failed to register', hotkeyQuit, '- using Alt+F4');
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (systemInterval) clearInterval(systemInterval);
  if (robloxInterval) clearInterval(robloxInterval);
  if (pingInterval) clearInterval(pingInterval);
  if (apiFastInterval) clearInterval(apiFastInterval);
  if (apiServerInterval) clearInterval(apiServerInterval);
  if (apiSlowInterval) clearInterval(apiSlowInterval);
  // Clean up temp helper files
  try { fs.unlinkSync(TEMP_FILE); } catch { /* ignore */ }
  try { fs.unlinkSync(path.join(app.getPath('temp'), 'kairozun_temp_helper.ps1')); } catch { /* ignore */ }
});

app.on('window-all-closed', (e) => {
  // Don't quit when settings window is closed — overlay stays
});
