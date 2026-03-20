const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu, shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');
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

// Faster GPU startup
app.commandLine.appendSwitch('disable-gpu-vsync');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

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
let tray = null;

// ── Roblox log reader ───────────────────────────────────────────────
const ROBLOX_LOG_DIR = path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'logs');

let robloxRunning = false;
let robloxInterval = null;
let cachedLogFile = null;
let cachedLogMtime = 0;
let cachedLogSize = 0;
let cachedLogContent = '';

function findLatestRobloxLog() {
  try {
    if (!fs.existsSync(ROBLOX_LOG_DIR)) return null;
    const files = fs.readdirSync(ROBLOX_LOG_DIR)
      .filter(f => f.endsWith('.log'))
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

  // Extract server IP and port from UDMUX Address
  const ipMatch = text.match(/UDMUX Address\s*=\s*([\d.]+),\s*Port\s*=\s*(\d+)/g);
  if (ipMatch) {
    const last = ipMatch[ipMatch.length - 1];
    const parts = last.match(/UDMUX Address\s*=\s*([\d.]+),\s*Port\s*=\s*(\d+)/);
    if (parts) {
      const newIp = parts[1];
      if (newIp !== robloxServerIp) {
        robloxServerIp = newIp;
        robloxServerPort = parts[2];
        serverRegion = null; // reset for new server
        fetchServerRegion(newIp);
      }
    }
  }

  // Extract server join time from the last game join report
  const joinMatches = [...text.matchAll(/^(\d{4}-\d{2}-\d{2}T[\d:.]+Z).*GameJoinLoadTime.*Report game_join_loadtime/gm)];
  if (joinMatches.length > 0) {
    const lastJoin = joinMatches[joinMatches.length - 1];
    robloxServerJoinTime = lastJoin[1];
  }

  // Extract userId from log (always present: userid:NNNNN)
  const uidMatches = text.match(/userid[\s:=]+(\d+)/gi);
  if (uidMatches) {
    const last = uidMatches[uidMatches.length - 1];
    const m = last.match(/(\d+)/);
    if (m) robloxUserIdFromLog = m[1];
  }

  // Extract username from join ticket (may not exist in all logs)
  const userMatch = text.match(/"UserName"%3a"([^"]+)"/i)
    || text.match(/"UserName"\s*:\s*"([^"]+)"/i);
  if (userMatch) robloxUsername = userMatch[1];

  // Extract display name
  const displayMatch = text.match(/"DisplayName"%3a"([^"]+)"/i)
    || text.match(/"DisplayName"\s*:\s*"([^"]+)"/i);
  if (displayMatch) data.displayName = displayMatch[1];

  // Extract game job/instance ID from Roblox log
  // Pattern: "Joining game 'UUID' place PLACEID"
  const jobIdMatches = [...text.matchAll(/Joining game '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})' place (\d+)/gi)];
  if (jobIdMatches.length > 0) {
    const lastMatch = jobIdMatches[jobIdMatches.length - 1];
    robloxJobIdFromLog = lastMatch[1];
    // Also extract placeId from the same join line (most reliable source)
    if (lastMatch[2]) robloxPlaceId = lastMatch[2];
  }

  // Extract ping from Roblox log stats (most accurate source)
  // Reset each cycle so we get fresh values
  logPingMs = null;
  // Search only the last ~200KB of log for recent ping values (fresher data)
  const recentText = text.length > 200000 ? text.slice(-200000) : text;
  const pingPatterns = [
    // Roblox network stats (most reliable, appears in modern Roblox clients)
    /STAT_Ping\s*[:=]\s*(\d+(?:\.\d+)?)/gi,
    /Stats\.Network\.Ping\s*[:=]\s*(\d+(?:\.\d+)?)/gi,
    // RakNet / UDMUX ping values
    /averagePingMs["'\s:=]+(\d+(?:\.\d+)?)/gi,
    /connectionPing["'\s:=]+(\d+(?:\.\d+)?)/gi,
    /networkPing["'\s:=]+(\d+(?:\.\d+)?)/gi,
    /avgPing["'\s:=]+(\d+(?:\.\d+)?)/gi,
    // JSON format in telemetry
    /"ping"\s*:\s*(\d+(?:\.\d+)?)/gi,
    // DataPing in connection quality reports
    /DataPing\s*[:=]\s*(\d+(?:\.\d+)?)/gi,
    // MicroProfiler network stats
    /MicroProfiler.*?ping["'\s:=]+(\d+(?:\.\d+)?)/gi,
  ];
  for (const pat of pingPatterns) {
    const matches = [...recentText.matchAll(pat)];
    if (matches.length > 0) {
      const last = matches[matches.length - 1];
      const val = Math.round(parseFloat(last[1]));
      if (val > 0 && val < 5000) { logPingMs = val; break; }
    }
  }

  // Detect in-game state: look for join and disconnect markers.
  // Use multiple patterns — Roblox logs vary across versions.
  const joinIdxs = [...text.matchAll(/Joining game '|GameJoinLoadTime|game_join_loadtime/gi)].map(m => m.index);
  const discIdxs = [...text.matchAll(/Client:Disconnect|OnDisconnect/gi)].map(m => m.index);
  const lastJoinIdx = joinIdxs.length > 0 ? joinIdxs[joinIdxs.length - 1] : -1;
  const lastDiscIdx = discIdxs.length > 0 ? discIdxs[discIdxs.length - 1] : -1;
  if (lastJoinIdx > lastDiscIdx) {
    robloxInGame = true;
  } else if (lastDiscIdx > lastJoinIdx && lastJoinIdx === -1) {
    // Only mark not-in-game if we see a disconnect without ANY join in the buffer
    // (large logs may have truncated the join line away)
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
  pingInterval = setInterval(doPing, 3000);
}

// ── Roblox API ──────────────────────────────────────────────────────
let robloxUserId = null;
let robloxApiData = {};

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 8000 }, (res) => {
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
      timeout: 8000,
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

let robloxPlaceId = null;
let robloxUniverseId = null;

async function fetchGameInfo() {
  if (!robloxUniverseId) return;
  try {
    const [gameResp, iconResp] = await Promise.all([
      httpsGet(`https://games.roblox.com/v1/games?universeIds=${robloxUniverseId}`),
      httpsGet(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${robloxUniverseId}&size=50x50&format=Png&isCircular=false`),
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

  // 2. Get friends list and check who's on same server
  try {
    const friendsResp = await httpsGet(`https://friends.roblox.com/v1/users/${robloxUserId}/friends`);
    if (friendsResp && friendsResp.data && friendsResp.data.length > 0) {
      const friendIds = friendsResp.data.map(f => f.id);
      const presenceResp = await httpsPost('https://presence.roblox.com/v1/presence/users', { userIds: friendIds.slice(0, 100) });
      if (presenceResp && presenceResp.userPresences) {
        const onServer = presenceResp.userPresences.filter(p =>
          p.userPresenceType === 2 && p.gameId && jobId && p.gameId === jobId
        );
        if (onServer.length > 0) {
          const ids = onServer.map(p => p.userId);
          const avatarResp = await httpsGet(
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${ids.join(',')}&size=150x150&format=Png`
          );
          const avatarMap = {};
          if (avatarResp && avatarResp.data) {
            for (const a of avatarResp.data) {
              if (a.imageUrl) avatarMap[a.targetId] = a.imageUrl;
            }
          }
          for (const p of onServer) {
            const friend = friendsResp.data.find(f => f.id === p.userId);
            if (friend) {
              players.push({
                userId: p.userId,
                username: friend.name,
                displayName: friend.displayName || friend.name,
                avatarUrl: avatarMap[p.userId] || null,
                isFriend: true,
              });
            }
          }
        }
      }
    }
  } catch { /* ignore */ }

  // 3. Fill remaining slots with anonymous placeholders
  // (Roblox removed playerTokens — no way to get anonymous player avatars anymore)
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
// Fast loop (8s): game info, presence — for live data
// Server loop (12s): server players — heavier call, separate to avoid rate limits
// Slow loop (40s): user info, votes, followers — rarely change
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
    // Server players need placeId from above calls
    if (robloxPlaceId) {
      await fetchServerPlayers();
      await fetchServerPlayerList();
    }
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
  }, 8000);
  apiServerInterval = setInterval(async () => {
    if (apiServerBusy || !robloxRunning || (!robloxInGame && robloxApiData.presenceType !== 2) || !robloxPlaceId) return;
    apiServerBusy = true;
    try {
      await fetchServerPlayers();
      await fetchServerPlayerList();
    } finally { apiServerBusy = false; }
  }, 12000);
  apiSlowInterval = setInterval(async () => {
    if (apiSlowBusy || !robloxRunning || (!robloxInGame && robloxApiData.presenceType !== 2) || !robloxUserId) return;
    apiSlowBusy = true;
    try {
      await fetchRobloxApiById(robloxUserId);
      await Promise.all([fetchGameVotes(), fetchUserInfo(), fetchFollowersCount()]);
    } finally { apiSlowBusy = false; }
  }, 40000);
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
  // Full check only every 3s when no cached PID
  const now = Date.now();
  if (now - lastProcessCheck < 3000) { callback(false); return; }
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
    const MAX = 1024 * 1024;
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
  setTimeout(() => {
    robloxInterval = setInterval(() => {
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
              const placeMatches = text.match(/placeid[\s:=]+(\d+)/gi);
              const univMatches = text.match(/universeid[\s:=]+(\d+)/gi);
              if (placeMatches) {
                const last = placeMatches[placeMatches.length - 1];
                const m = last.match(/(\d+)/);
                if (m) robloxPlaceId = m[1];
              }
              if (univMatches) {
                const last = univMatches[univMatches.length - 1];
                const m = last.match(/(\d+)/);
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
                const keepKeys = ['avatarUrl', 'username', 'displayName', 'friendsCount',
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
                  doImmediateFullFetch();
                } else if (robloxUsername) {
                  doImmediateFullFetch();
                }
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
        }
        const send = (win) => {
          if (win && !win.isDestroyed()) win.webContents.send('roblox-data', robloxData);
        };
        // Only send if data actually changed (reduces IPC overhead)
        const dataJson = JSON.stringify(robloxData);
        if (dataJson !== lastSentDataJson) {
          lastSentDataJson = dataJson;
          send(overlayWindow);
          send(settingsWindow);
        }
      });
    }, 2500);
  }, 300);
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
      backgroundThrottling: false,
    },
  });

  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');

  // Apply saved screen recording visibility
  if (savedSettings && savedSettings.showOnCapture) {
    overlayWindow.setContentProtection(false);
  } else {
    overlayWindow.setContentProtection(false);
  }
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
    resizable: false,
    alwaysOnTop: true,
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

  systemInterval = setInterval(() => {
    const cur = getCpuUsage();
    const idleDiff = cur.idle - prevCpu.idle;
    const totalDiff = cur.total - prevCpu.total;
    const cpuPercent = totalDiff === 0 ? 0 : Math.round((1 - idleDiff / totalDiff) * 100);
    prevCpu = cur;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = Math.round((usedMem / totalMem) * 100);

    const uptimeSec = os.uptime();
    const procMem = process.memoryUsage();

    // Network interfaces
    const nets = os.networkInterfaces();
    const netInfo = [];
    for (const [name, addrs] of Object.entries(nets)) {
      for (const a of addrs) {
        if (!a.internal && a.family === 'IPv4') {
          netInfo.push({ name, ip: a.address });
        }
      }
    }

    const metrics = {
      cpu: cpuPercent,
      mem: memPercent,
      totalMemGB: +(totalMem / 1073741824).toFixed(1),
      usedMemGB: +(usedMem / 1073741824).toFixed(1),
      freeMemGB: +(freeMem / 1073741824).toFixed(1),
      uptime: uptimeSec,
      appMemMB: Math.round(procMem.rss / 1048576),
      network: netInfo,
    };
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('system-metrics', metrics);
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('system-metrics', metrics);
    }
  }, 3000);

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
  if (settings.showOnCapture !== undefined && overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setContentProtection(!settings.showOnCapture);
  }
});

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
});

ipcMain.on('minimize-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.minimize();
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

// Custom hotkey rebinding
ipcMain.on('set-hotkey', (_e, { action, accelerator }) => {
  try {
    if (action === 'settings') {
      const prev = savedSettings && savedSettings.hotkeySettings ? savedSettings.hotkeySettings : 'Alt+0';
      // Test registration first
      const ok = globalShortcut.register(accelerator, () => {
        if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
        else createSettingsWindow();
      });
      if (ok) {
        // Unregister previous only after successful new registration
        if (accelerator !== prev) {
          try { globalShortcut.unregister(prev); } catch { /* ignore */ }
        }
      }
    } else if (action === 'overlay') {
      const prev = savedSettings && savedSettings.hotkeyOverlay ? savedSettings.hotkeyOverlay : 'CommandOrControl+Shift+H';
      const ok = globalShortcut.register(accelerator, () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          if (overlayWindow.isVisible()) overlayWindow.hide();
          else overlayWindow.show();
        }
      });
      if (ok) {
        if (accelerator !== prev) {
          try { globalShortcut.unregister(prev); } catch { /* ignore */ }
        }
      }
    }
  } catch { /* ignore invalid accelerator */ }
});

// Toggle screen recording visibility
ipcMain.on('set-capture-mode', (_e, visible) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setContentProtection(!visible);
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
  } else if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.show();
  }
});

app.whenReady().then(() => {
  savedSettings = loadSettings();
  loadGameHistory();
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
        overlayWindow.isVisible() ? overlayWindow.hide() : overlayWindow.show();
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
  try {
    regSettings = globalShortcut.register(hotkeySettings, () => {
      if (settingsWindow && !settingsWindow.isDestroyed()) {
        settingsWindow.close();
      } else {
        createSettingsWindow();
      }
    });
  } catch { /* invalid accelerator */ }
  if (!regSettings && hotkeySettings !== 'Alt+0') {
    // Fallback to default if custom hotkey failed
    try {
      globalShortcut.register('Alt+0', () => {
        if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
        else createSettingsWindow();
      });
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
        if (overlayWindow.isVisible()) overlayWindow.hide();
        else overlayWindow.show();
      }
    });
  } catch { /* invalid accelerator */ }
  if (!regOverlay && hotkeyOverlay !== 'CommandOrControl+Shift+H') {
    try {
      globalShortcut.register('CommandOrControl+Shift+H', () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          if (overlayWindow.isVisible()) overlayWindow.hide();
          else overlayWindow.show();
        }
      });
    } catch { /* ignore */ }
    console.log('[Hotkey] Overlay: failed to register', hotkeyOverlay, '— using Ctrl+Shift+H');
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
});

app.on('window-all-closed', (e) => {
  // Don't quit when settings window is closed — overlay stays
});
