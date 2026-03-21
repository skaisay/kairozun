/* ════════════════════════════════════════════════════════════════════
   Kairozun Overlay — Renderer Logic (Real Roblox Data)
   ════════════════════════════════════════════════════════════════════ */

// ── i18n ─────────────────────────────────────────────────────────────
const i18n = {
  en: {
    fps: 'FPS',
    ping: 'PING',
    friends: 'FR',
    hint: 'Alt+0 — Settings  |  Ctrl+Shift+H — Hide',
    servers: 'SRV',
    players: 'Players',
  },
  ru: {
    fps: 'ФПС',
    ping: 'ПИНГ',
    friends: 'ДР',
    hint: 'Alt+0 — Настройки  |  Ctrl+Shift+H — Скрыть',
    servers: 'СРВ',
    players: 'Игроки',
  },
};

let currentLang = 'en';

function applyLang(lang) {
  currentLang = lang;
  const strings = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) el.textContent = strings[key];
  });
}

// ── Elements ─────────────────────────────────────────────────────────
function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

// ── Panel opacity helper ─────────────────────────────────────────────
const PANEL_BG_GRADIENT = 'linear-gradient(165deg, rgba(255,255,255,0.06) 0%, rgba(140,150,200,0.04) 30%, rgba(120,130,180,0.03) 60%, rgba(255,255,255,0.05) 100%)';
let currentPanelOpacity = 0.82;

function applyPanelOpacity(op) {
  currentPanelOpacity = op;
  const bg = PANEL_BG_GRADIENT + ', rgba(8,8,16,' + op + ')';
  document.querySelectorAll('.glass-panel').forEach(p => { p.style.background = bg; });
}

function applyAccentColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.body.style.setProperty('--accent', hex);
  document.body.style.setProperty('--accent-rgb', r + ',' + g + ',' + b);
}

const fpsEl = document.getElementById('fps-value');
const pingEl = document.getElementById('ping-value');
const cpuBar = document.getElementById('cpu-bar');
const cpuValue = document.getElementById('cpu-value');
const memBar = document.getElementById('mem-bar');
const memValue = document.getElementById('mem-value');
const statusDot = document.getElementById('roblox-status');
const killFeed = document.getElementById('kill-feed');
const friendsValue = document.getElementById('friends-value');
const gameName = document.getElementById('game-name');
const playersValue = document.getElementById('players-value');
const avatarImg = document.getElementById('avatar-img');
const avatarLetter = document.getElementById('avatar-letter');
const gameIcon = document.getElementById('game-icon');
const serverIpEl = document.getElementById('server-ip');
const visitsValue = document.getElementById('visits-value');

// Cache frequently accessed DOM elements to avoid repeated getElementById calls
const followersValueEl = document.getElementById('followers-value');
const followersRowEl = document.getElementById('followers-row');
const accountAgeValueEl = document.getElementById('account-age-value');
const accountAgeRowEl = document.getElementById('account-age-row');
const gameRowEl = document.getElementById('game-row');
const creatorValueEl = document.getElementById('creator-value');
const creatorRowEl = document.getElementById('creator-row');
const playersRowEl = document.getElementById('players-row');
const onlineValueEl = document.getElementById('online-value');
const onlineRowEl = document.getElementById('online-row');
const serverFpsValueEl = document.getElementById('server-fps-value');
const serverFpsRowEl = document.getElementById('server-fps-row');
const fpsSrvPartEl = document.getElementById('fps-srv-part');
const serverRowEl = document.getElementById('server-row');
const regionValueEl = document.getElementById('region-value');
const regionRowEl = document.getElementById('region-row');
const uptimeValueEl = document.getElementById('uptime-value');
const uptimeRowEl = document.getElementById('uptime-row');
const visitsRowEl = document.getElementById('visits-row');
const favsValueEl = document.getElementById('favs-value');
const favsRowEl = document.getElementById('favs-row');
const genreValueEl = document.getElementById('genre-value');
const genreRowEl = document.getElementById('genre-row');
const ratingValueEl = document.getElementById('rating-value');
const ratingRowEl = document.getElementById('rating-row');
const serversValueEl = document.getElementById('servers-value');
const serversRowEl = document.getElementById('servers-row');
const panelMl = document.getElementById('panel-ml');
const playerListCountEl = document.getElementById('player-list-count');
const playerAvatarGridEl = document.getElementById('player-avatar-grid');
const usernameEl = document.getElementById('username');

// Cache last known good avatar URL to prevent flickering/disappearing
let cachedAvatarUrl = null;

// Avatar error handler — fallback to letter on load failure, retry from cache
avatarImg.addEventListener('error', () => {
  // Don't hide avatar if we have a cached URL and it's different from current
  if (cachedAvatarUrl && avatarImg.src !== cachedAvatarUrl) {
    avatarImg.src = cachedAvatarUrl;
  } else {
    avatarImg.classList.add('hidden');
    avatarLetter.classList.remove('hidden');
  }
});
avatarImg.addEventListener('load', () => {
  cachedAvatarUrl = avatarImg.src;
  avatarImg.classList.remove('hidden');
  avatarLetter.classList.add('hidden');
});

// Game icon error handler
gameIcon.addEventListener('error', () => {
  gameIcon.classList.add('hidden');
});

// ── FPS counter (overlay's own framerate as fallback) ────────────────
let overlayFps = 0;
let frames = 0;
let lastFpsTime = performance.now();
let fpsRafActive = false;

function fpsLoop() {
  frames++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    overlayFps = frames;
    frames = 0;
    lastFpsTime = now;
  }
  // Only keep rAF running when we need overlay FPS (no Roblox data)
  if (lastRobloxFps == null) {
    requestAnimationFrame(fpsLoop);
  } else {
    fpsRafActive = false;
  }
}

// Start rAF only when needed
function ensureFpsLoop() {
  if (!fpsRafActive) {
    fpsRafActive = true;
    requestAnimationFrame(fpsLoop);
  }
}

// ── FPS color coding ─────────────────────────────────────────────────
function setFpsColor(el, fps) {
  el.classList.remove('value-good', 'value-warn', 'value-bad');
  if (fps >= 45) el.classList.add('value-good');
  else if (fps >= 25) el.classList.add('value-warn');
  else el.classList.add('value-bad');
}

function setPingColor(el, ping) {
  el.classList.remove('value-good', 'value-warn', 'value-bad');
  if (ping <= 60) el.classList.add('value-good');
  else if (ping <= 120) el.classList.add('value-warn');
  else el.classList.add('value-bad');
}

// ── Roblox real data ─────────────────────────────────────────────────
let robloxConnected = false;
let lastRobloxFps = null;
let lastRobloxPing = null;

// Widget visibility toggles (for rows controlled by Roblox data)
const widgetToggles = {
  showGame: true,
  showPlayers: true,
  showServer: true,
  showVisits: true,
  showFavorites: true,
  showGenre: true,
  showRating: true,
  showRegion: true,
  showUptime: true,
  showPlayerList: true,
};

window.kairozun.onRobloxData((data) => {
  robloxConnected = data.running;
  statusDot.classList.toggle('offline', !data.running);
  statusDot.title = data.running ? 'Roblox: Online' : 'Roblox: Offline';

  if (data.fps != null) {
    lastRobloxFps = data.fps;
    fpsEl.textContent = data.fps;
    setFpsColor(fpsEl, data.fps);
    // Update combined display if server FPS is already known
    if (fpsSrvPartEl && !fpsSrvPartEl.classList.contains('hidden')) {
      fpsSrvPartEl.textContent = ' — ' + (fpsSrvPartEl.dataset.srvFps || '--') + ' srv';
    }
  }

  if (data.ping != null) {
    lastRobloxPing = data.ping;
    pingEl.textContent = data.ping + ' ms';
    setPingColor(pingEl, data.ping);
  }

  // Username from logs or API
  if (data.username) {
    const display = data.displayName || data.username;
    usernameEl.textContent = display;
    avatarLetter.textContent = display.charAt(0).toUpperCase();
  }

  // Avatar from Roblox API — use cached URL as fallback
  if (data.avatarUrl) {
    if (avatarImg.src !== data.avatarUrl) {
      avatarImg.src = data.avatarUrl;
      // load/error events handle visibility
    }
  } else if (cachedAvatarUrl && avatarImg.classList.contains('hidden')) {
    // Restore from cache if API didn't return avatar this cycle
    avatarImg.src = cachedAvatarUrl;
  }

  // Friends count
  if (data.friendsCount != null) {
    friendsValue.textContent = data.friendsCount;
  }

  // Followers count
  if (data.followersCount != null) {
    followersValueEl.textContent = formatNumber(data.followersCount);
    followersRowEl.classList.remove('hidden');
  }

  // Account age
  if (data.accountCreated) {
    const created = new Date(data.accountCreated);
    const now = new Date();
    const diffMs = now - created;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let ageText;
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const months = Math.floor((days % 365) / 30);
      ageText = years + (currentLang === 'ru' ? 'г' : 'y') + (months > 0 ? ' ' + months + (currentLang === 'ru' ? 'м' : 'mo') : '');
    } else if (days >= 30) {
      ageText = Math.floor(days / 30) + (currentLang === 'ru' ? 'м' : 'mo');
    } else {
      ageText = days + (currentLang === 'ru' ? 'д' : 'd');
    }
    accountAgeValueEl.textContent = ageText;
    accountAgeRowEl.classList.remove('hidden');
  }

  // Game info
  if (data.gameName) {
    gameName.textContent = data.gameName;
    if (data.gameDescription) gameName.title = data.gameDescription.substring(0, 200);
    if (widgetToggles.showGame) gameRowEl.classList.remove('hidden');
  }
  if (data.gameCreator) {
    creatorValueEl.textContent = data.gameCreator;
    if (widgetToggles.showGame) creatorRowEl.classList.remove('hidden');
  }
  if (data.gameIcon && gameIcon.src !== data.gameIcon) {
    gameIcon.src = data.gameIcon;
    gameIcon.classList.remove('hidden');
  }
  if (data.serverPlayerCount != null) {
    playersValue.textContent = data.serverPlayerCount + (data.serverMaxPlayers ? '/' + data.serverMaxPlayers : '');
    if (widgetToggles.showPlayers) playersRowEl.classList.remove('hidden');
  } else if (data.gamePlaying != null) {
    playersValue.textContent = data.gamePlaying + (data.gameMaxPlayers ? '/' + data.gameMaxPlayers : '');
    if (widgetToggles.showPlayers) playersRowEl.classList.remove('hidden');
  }
  // Total online in game
  if (data.gamePlaying != null) {
    onlineValueEl.textContent = formatNumber(data.gamePlaying) + ' online';
    onlineRowEl.classList.remove('hidden');
  }
  // Server FPS — show in game info panel and inline in FPS widget
  if (data.serverFps != null) {
    serverFpsValueEl.textContent = data.serverFps + ' srv fps';
    serverFpsRowEl.classList.remove('hidden');
    if (fpsSrvPartEl) {
      fpsSrvPartEl.dataset.srvFps = data.serverFps;
      fpsSrvPartEl.textContent = ' — ' + data.serverFps + ' srv';
      fpsSrvPartEl.classList.remove('hidden');
    }
  }
  if (data.serverIp) {
    serverIpEl.textContent = data.serverIp;
    if (widgetToggles.showServer) serverRowEl.classList.remove('hidden');
  }
  if (data.serverRegion) {
    regionValueEl.textContent = data.serverRegion;
    if (widgetToggles.showRegion) regionRowEl.classList.remove('hidden');
  }
  if (data.serverJoinTime) {
    const elapsed = Math.floor((Date.now() - new Date(data.serverJoinTime).getTime()) / 1000);
    if (elapsed >= 0) {
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      uptimeValueEl.textContent = h > 0
        ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
        : m + ':' + String(s).padStart(2, '0');
      if (widgetToggles.showUptime) uptimeRowEl.classList.remove('hidden');
    }
  }
  if (data.gameVisits != null) {
    visitsValue.textContent = formatNumber(data.gameVisits);
    if (widgetToggles.showVisits) visitsRowEl.classList.remove('hidden');
  }
  if (data.gameFavorites != null) {
    if (favsValueEl) favsValueEl.textContent = formatNumber(data.gameFavorites);
    if (favsRowEl && widgetToggles.showFavorites) favsRowEl.classList.remove('hidden');
  }

  // Genre
  if (data.gameGenre) {
    genreValueEl.textContent = data.gameGenre;
    if (widgetToggles.showGenre) genreRowEl.classList.remove('hidden');
  }

  // Rating
  if (data.gameRating != null) {
    ratingValueEl.textContent = data.gameRating + '%';
    if (widgetToggles.showRating) ratingRowEl.classList.remove('hidden');
  }

  // Servers
  if (data.totalServers != null) {
    serversValueEl.textContent = data.totalServers + ' srv';
    serversRowEl.classList.remove('hidden');
  }

  // Player list (names + avatars from serverPlayerList)
  if (data.serverPlayerList && data.serverPlayerList.length > 0) {
    renderPlayerList(data.serverPlayerList, data.serverPlayerCount || data.serverPlayerList.length);
    if (widgetToggles.showPlayerList) panelMl.classList.remove('panel-hidden');
  } else if (data.serverPlayerCount > 0 && widgetToggles.showPlayerList) {
    playerListCountEl.textContent = data.serverPlayerCount;
    panelMl.classList.remove('panel-hidden');
  }

  // When Roblox is offline or not in game, hide game info
  // But only if we ALSO have no game data (prevents false negatives from log truncation)
  const hasGameData = !!(data.gameName || data.serverPlayerCount || data.placeId);
  if (!data.running || (!data.inGame && !hasGameData)) {
    gameRowEl.classList.add('hidden');
    creatorRowEl.classList.add('hidden');
    playersRowEl.classList.add('hidden');
    serverRowEl.classList.add('hidden');
    visitsRowEl.classList.add('hidden');
    if (favsRowEl) favsRowEl.classList.add('hidden');
    genreRowEl.classList.add('hidden');
    ratingRowEl.classList.add('hidden');
    serversRowEl.classList.add('hidden');
    onlineRowEl.classList.add('hidden');
    serverFpsRowEl.classList.add('hidden');
    if (fpsSrvPartEl) { fpsSrvPartEl.classList.add('hidden'); fpsSrvPartEl.textContent = ''; }
    regionRowEl.classList.add('hidden');
    uptimeRowEl.classList.add('hidden');
    followersRowEl.classList.add('hidden');
    accountAgeRowEl.classList.add('hidden');
    panelMl.classList.add('panel-hidden');
    playerAvatarGridEl.innerHTML = '';
    gameIcon.classList.add('hidden');
    friendsValue.textContent = '--';
    // Only hide avatar if truly offline (no cached URL)
    if (!avatarImg.classList.contains('hidden') && !cachedAvatarUrl) {
      avatarImg.classList.add('hidden');
      avatarLetter.classList.remove('hidden');
    }
  }
});

// Fallback: if no Roblox data, show overlay FPS
setInterval(() => {
  if (lastRobloxFps == null) {
    ensureFpsLoop();
    fpsEl.textContent = overlayFps;
    setFpsColor(fpsEl, overlayFps);
  }
  if (!robloxConnected) {
    pingEl.textContent = '--';
    lastRobloxPing = null;
  }
}, 1000);

// ── Screenshot notification ─────────────────────────────────────────
window.kairozun.onScreenshotTaken(() => {
  // Brief white flash + fade to confirm capture
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;background:rgba(255,255,255,0.18);z-index:99999;pointer-events:none;transition:opacity 0.4s ease';
  document.body.appendChild(flash);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { flash.style.opacity = '0'; });
  });
  setTimeout(() => flash.remove(), 500);
});

// ── Screen Recording ────────────────────────────────────────────────
let mediaRecorder = null;
let recordedChunks = [];
let recTimerInterval = null;
let recStartTime = 0;

const recIndicator = document.getElementById('rec-indicator');
const recTimerEl = document.getElementById('rec-timer');

function updateRecTimer() {
  const elapsed = Math.floor((Date.now() - recStartTime) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  recTimerEl.textContent = m + ':' + String(s).padStart(2, '0');
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

// Quality presets: bitrate & fps
const QUALITY_PRESETS = {
  max:    { fps: 60, bitrate: 50_000_000 },
  high:   { fps: 60, bitrate: 25_000_000 },
  medium: { fps: 30, bitrate: 10_000_000 },
};

window.kairozun.onStartRecording(async ({ sourceId, width, height, duration, quality, showOverlay }) => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') return;

  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.high;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: width,
          maxWidth: width,
          minHeight: height,
          maxHeight: height,
          minFrameRate: preset.fps,
          maxFrameRate: preset.fps,
        },
      },
    });

    // Prefer H264 (hardware-accelerated) over VP9 (CPU-heavy)
    let mimeType = 'video/webm;codecs=h264';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: preset.bitrate,
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(recTimerInterval);
      recIndicator.classList.add('hidden');
      window.kairozun.recordingState(false);

      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const arrayBuf = await blob.arrayBuffer();
        window.kairozun.saveRecording(new Uint8Array(arrayBuf));
      }
      recordedChunks = [];
      mediaRecorder = null;
    };

    mediaRecorder.start(1000);
    recStartTime = Date.now();
    recTimerEl.textContent = '0:00';
    recIndicator.classList.remove('hidden');
    window.kairozun.recordingState(true);
    recTimerInterval = setInterval(updateRecTimer, 1000);

    // Auto-stop after duration
    setTimeout(() => {
      stopRecording();
    }, duration * 1000);
  } catch {
    window.kairozun.recordingState(false);
  }
});

window.kairozun.onStopRecording(() => {
  stopRecording();
});

// ── System Metrics (from main process) ───────────────────────────────
window.kairozun.onSystemMetrics(({ cpu, mem }) => {
  cpuBar.style.width = cpu + '%';
  cpuValue.textContent = cpu + '%';
  memBar.style.width = mem + '%';
  memValue.textContent = mem + '%';
});

// ── Kill Feed ────────────────────────────────────────────────────────
const MAX_KILLS = 4;

function addKillEntry(killer, victim) {
  const entry = document.createElement('div');
  entry.className = 'kill-entry';
  entry.innerHTML = `<span class="killer">${escapeHtml(killer)}</span> → <span class="victim">${escapeHtml(victim)}</span>`;
  killFeed.prepend(entry);
  while (killFeed.children.length > MAX_KILLS) {
    killFeed.removeChild(killFeed.lastChild);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Player List Rendering (with names) ───────────────────────────────
const MAX_PLAYERS_SHOWN = 20;
let lastPlayerListKey = '';

function renderPlayerList(players, totalCount) {
  playerListCountEl.textContent = totalCount;

  const key = players.map(p => p.userId + ':' + (p.avatarUrl || '') + ':' + (p.isAnon ? 'a' : 'k')).join(',');
  if (key === lastPlayerListKey) return;
  lastPlayerListKey = key;

  playerAvatarGridEl.innerHTML = '';
  const shown = players.slice(0, MAX_PLAYERS_SHOWN);
  const frag = document.createDocumentFragment();
  for (const p of shown) {
    const item = document.createElement('div');
    item.className = 'player-row-item' + (p.isSelf ? ' self' : '') + (p.isFriend ? ' friend' : '') + (p.isAnon ? ' anon' : '');
    if (p.avatarUrl) {
      const img = document.createElement('img');
      img.src = p.avatarUrl;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.className = 'player-row-avatar';
      img.onerror = () => { img.style.display = 'none'; };
      item.appendChild(img);
    } else {
      const letter = document.createElement('div');
      letter.className = 'player-row-letter';
      letter.textContent = (p.displayName || p.username || '?')[0].toUpperCase();
      item.appendChild(letter);
    }
    const name = document.createElement('span');
    name.className = 'player-row-name';
    name.textContent = p.displayName || p.username;
    item.appendChild(name);
    if (p.isSelf) {
      const tag = document.createElement('span');
      tag.className = 'player-row-tag';
      tag.textContent = 'YOU';
      item.appendChild(tag);
    } else if (p.isFriend) {
      const tag = document.createElement('span');
      tag.className = 'player-row-tag friend-tag';
      tag.textContent = 'FR';
      item.appendChild(tag);
    }
    frag.appendChild(item);
  }
  if (totalCount > shown.length) {
    const more = document.createElement('div');
    more.className = 'player-avatar-more';
    more.textContent = '+' + (totalCount - shown.length);
    frag.appendChild(more);
  }
  playerAvatarGridEl.appendChild(frag);
}

// Fallback: anonymous avatar thumbnails (when serverPlayerList unavailable)
const MAX_AVATARS = 25;
let lastAvatarUrls = [];

function renderPlayerAvatarsAnon(avatars, totalCount) {
  playerListCountEl.textContent = totalCount;

  const key = avatars.join(',');
  if (key === lastAvatarUrls.join(',')) return;
  lastAvatarUrls = avatars.slice();

  playerAvatarGridEl.innerHTML = '';
  const shown = avatars.slice(0, MAX_AVATARS);
  const frag = document.createDocumentFragment();
  for (const url of shown) {
    const item = document.createElement('div');
    item.className = 'player-avatar-item';
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    img.onerror = () => { img.style.display = 'none'; };
    item.appendChild(img);
    frag.appendChild(item);
  }
  if (totalCount > shown.length) {
    const more = document.createElement('div');
    more.className = 'player-avatar-more';
    more.textContent = '+' + (totalCount - shown.length);
    frag.appendChild(more);
  }
  playerAvatarGridEl.appendChild(frag);
}

// ── Auto-hide empty panels ───────────────────────────────────────────
function checkPanelVisibility() {
  const panelTL = document.getElementById('panel-tl');
  const fpsHidden = document.getElementById('fps-row').classList.contains('hidden');
  const pingHidden = document.getElementById('ping-row').classList.contains('hidden');
  panelTL.classList.toggle('panel-hidden', fpsHidden && pingHidden);
}

// ── Hint auto-fade (5 seconds) ──────────────────────────────────────
const hintPanel = document.getElementById('panel-bc');
setTimeout(() => {
  hintPanel.classList.add('fade-out');
}, 5000);

// ── Draggable panels (mouseenter/mouseleave approach) ────────────────
const POSITION_KEY = 'kairozun_panel_positions';
let isDragging = false;
let dragPanel = null;
let startX, startY, origX, origY;
let dragRafId = null;
let dragTargetX = 0, dragTargetY = 0;

// Store scale per panel
const panelScales = {};

function getPanelScale(panel) {
  return panelScales[panel.id] || 1;
}

function panelScaleOrigin(id) {
  if (id === 'panel-tl') return 'top left';
  if (id === 'panel-tr') return 'top right';
  if (id === 'panel-bl') return 'bottom left';
  if (id === 'panel-br') return 'bottom right';
  if (id === 'panel-ml') return 'center left';
  return 'center';
}

function loadPositions() {
  try { return JSON.parse(localStorage.getItem(POSITION_KEY)) || {}; } catch { return {}; }
}

function savePositions(positions) {
  localStorage.setItem(POSITION_KEY, JSON.stringify(positions));
}

function restorePositions() {
  const positions = loadPositions();
  Object.entries(positions).forEach(([id, pos]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.top = pos.top + 'px';
    el.style.left = pos.left + 'px';
    el.style.right = 'auto';
    el.style.bottom = 'auto';
    const s = panelScales[id] || 1;
    if (s !== 1) {
      el.style.transform = 'scale(' + s + ')';
      el.style.transformOrigin = panelScaleOrigin(id);
    } else {
      el.style.transform = 'none';
    }
  });
}

document.querySelectorAll('.glass-panel').forEach((panel) => {
  panel.addEventListener('mouseenter', () => {
    if (!isDragging) {
      window.kairozun.setOverlayMouse(false);
      panel.style.cursor = 'grab';
    }
  });

  panel.addEventListener('mouseleave', () => {
    if (!isDragging) {
      window.kairozun.setOverlayMouse(true);
      panel.style.cursor = '';
    }
  });

  panel.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    dragPanel = panel;
    panel.classList.add('dragging');
    panel.style.cursor = 'grabbing';

    // Use offsetLeft/offsetTop (unaffected by CSS transforms) for accurate position
    const parsedLeft = parseFloat(panel.style.left);
    const parsedTop = parseFloat(panel.style.top);
    origX = isNaN(parsedLeft) ? panel.offsetLeft : parsedLeft;
    origY = isNaN(parsedTop) ? panel.offsetTop : parsedTop;
    startX = e.clientX;
    startY = e.clientY;
    // Disable backdrop-filter during drag to eliminate GPU stutter
    panel.style.backdropFilter = 'none';
    panel.style.webkitBackdropFilter = 'none';
    // Keep transform:scale during drag — removing it causes visual zoom jumps
    panel.style.transition = 'none';
    e.preventDefault();
  });
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging || !dragPanel) return;
  dragTargetX = origX + (e.clientX - startX);
  dragTargetY = origY + (e.clientY - startY);
  // Use rAF to batch position updates at display refresh rate
  if (!dragRafId) {
    dragRafId = requestAnimationFrame(() => {
      if (dragPanel) {
        dragPanel.style.top = dragTargetY + 'px';
        dragPanel.style.left = dragTargetX + 'px';
        dragPanel.style.right = 'auto';
        dragPanel.style.bottom = 'auto';
      }
      dragRafId = null;
    });
  }
});

document.addEventListener('mouseup', (e) => {
  if (!isDragging || !dragPanel) return;
  if (dragRafId) { cancelAnimationFrame(dragRafId); dragRafId = null; }
  dragPanel.classList.remove('dragging');
  dragPanel.style.cursor = 'grab';
  // Restore backdrop-filter and transition
  dragPanel.style.backdropFilter = '';
  dragPanel.style.webkitBackdropFilter = '';
  dragPanel.style.transition = '';

  const positions = loadPositions();
  positions[dragPanel.id] = {
    top: parseInt(dragPanel.style.top),
    left: parseInt(dragPanel.style.left),
  };
  savePositions(positions);

  // Check if mouse is still over the panel — if so, keep mouse capture
  // to allow immediate re-drag without needing to re-enter the panel
  const rect = dragPanel.getBoundingClientRect();
  const overPanel = e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom;

  isDragging = false;
  dragPanel = null;

  if (!overPanel) {
    window.kairozun.setOverlayMouse(true);
  }
});

restorePositions();

// ── Settings bridge ──────────────────────────────────────────────────
window.kairozun.onApplySettings((settings) => {
  if (settings.lang) applyLang(settings.lang);
  if (settings.showFps !== undefined) {
    document.getElementById('fps-row').classList.toggle('hidden', !settings.showFps);
  }
  if (settings.showPing !== undefined) {
    document.getElementById('ping-row').classList.toggle('hidden', !settings.showPing);
  }
  if (settings.showSystem !== undefined) {
    document.getElementById('panel-bl').classList.toggle('panel-hidden', !settings.showSystem);
  }
  if (settings.showKillFeed !== undefined) {
    killFeed.classList.toggle('hidden', !settings.showKillFeed);
  }
  if (settings.showAccount !== undefined) {
    document.querySelector('#panel-tr .panel-header').classList.toggle('hidden', !settings.showAccount);
  }
  if (settings.showFriends !== undefined) {
    document.getElementById('friends-row').classList.toggle('hidden', !settings.showFriends);
  }
  if (settings.showGame !== undefined) {
    widgetToggles.showGame = settings.showGame;
    document.getElementById('game-row').classList.toggle('hidden', !settings.showGame);
    document.getElementById('creator-row').classList.toggle('hidden', !settings.showGame);
  }
  if (settings.showPlayers !== undefined) {
    widgetToggles.showPlayers = settings.showPlayers;
    document.getElementById('players-row').classList.toggle('hidden', !settings.showPlayers);
  }
  if (settings.showServer !== undefined) {
    widgetToggles.showServer = settings.showServer;
    document.getElementById('server-row').classList.toggle('hidden', !settings.showServer);
  }
  if (settings.showVisits !== undefined) {
    widgetToggles.showVisits = settings.showVisits;
    document.getElementById('visits-row').classList.toggle('hidden', !settings.showVisits);
  }
  if (settings.showFavorites !== undefined) {
    widgetToggles.showFavorites = settings.showFavorites;
    const favsRow = document.getElementById('favs-row');
    if (favsRow) favsRow.classList.toggle('hidden', !settings.showFavorites);
  }
  if (settings.showGenre !== undefined) {
    widgetToggles.showGenre = settings.showGenre;
    document.getElementById('genre-row').classList.toggle('hidden', !settings.showGenre);
  }
  if (settings.showRating !== undefined) {
    widgetToggles.showRating = settings.showRating;
    document.getElementById('rating-row').classList.toggle('hidden', !settings.showRating);
  }
  if (settings.showRegion !== undefined) {
    widgetToggles.showRegion = settings.showRegion;
    document.getElementById('region-row').classList.toggle('hidden', !settings.showRegion);
  }
  if (settings.showUptime !== undefined) {
    widgetToggles.showUptime = settings.showUptime;
    document.getElementById('uptime-row').classList.toggle('hidden', !settings.showUptime);
  }
  if (settings.showPlayerList !== undefined) {
    widgetToggles.showPlayerList = settings.showPlayerList;
    document.getElementById('panel-ml').classList.toggle('panel-hidden', !settings.showPlayerList);
  }
  if (settings.showClock !== undefined) {
    document.getElementById('panel-br').classList.toggle('panel-hidden', !settings.showClock);
  }
  // Widget scale — use CSS transform:scale with transform-origin
  function applyScale(panelId, scale) {
    panelScales[panelId] = scale;
    const el = document.getElementById(panelId);
    el.style.zoom = '';
    el.style.fontSize = '';
    el.style.padding = '';
    el.style.transform = 'scale(' + scale + ')';
    el.style.transformOrigin = panelScaleOrigin(panelId);
  }
  if (settings.scaleTL !== undefined) applyScale('panel-tl', settings.scaleTL);
  if (settings.scaleTR !== undefined) applyScale('panel-tr', settings.scaleTR);
  if (settings.scaleBL !== undefined) applyScale('panel-bl', settings.scaleBL);
  if (settings.scaleBR !== undefined) applyScale('panel-br', settings.scaleBR);
  if (settings.scaleML !== undefined) applyScale('panel-ml', settings.scaleML);

  // Overlay opacity — apply directly to panels for reliability
  if (settings.overlayOpacity !== undefined) {
    const op = Math.max(0.3, Math.min(1, settings.overlayOpacity));
    applyPanelOpacity(op);
  }

  // Accent color
  if (settings.accentColor) {
    applyAccentColor(settings.accentColor);
  }

  checkPanelVisibility();
});

// Initial language — read saved settings synchronously to avoid flicker
const _initSettings = window.kairozun.getSettings();
applyLang(_initSettings && _initSettings.lang ? _initSettings.lang : 'en');

// Apply saved opacity and accent on load
if (_initSettings) {
  if (_initSettings.overlayOpacity !== undefined) {
    const op = Math.max(0.3, Math.min(1, _initSettings.overlayOpacity));
    applyPanelOpacity(op);
  }
  if (_initSettings.accentColor) {
    applyAccentColor(_initSettings.accentColor);
  }
}

// ── Clock & Session Timer ────────────────────────────────────────────
const clockEl = document.getElementById('clock-value');
const sessionEl = document.getElementById('session-value');
const sessionStart = Date.now();

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  clockEl.textContent = h + ':' + m;

  const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
  const eh = Math.floor(elapsed / 3600);
  const em = Math.floor((elapsed % 3600) / 60);
  const es = elapsed % 60;
  sessionEl.textContent = eh > 0
    ? eh + ':' + String(em).padStart(2, '0') + ':' + String(es).padStart(2, '0')
    : em + ':' + String(es).padStart(2, '0');
}

updateClock();
setInterval(updateClock, 1000);
