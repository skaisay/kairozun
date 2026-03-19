/* ════════════════════════════════════════════════════════════════════
   Kairozun Overlay — Renderer Logic (Real Roblox Data)
   ════════════════════════════════════════════════════════════════════ */

// ── i18n ─────────────────────────────────────────────────────────────
const i18n = {
  en: {
    fps: 'FPS',
    ping: 'PING',
    hint: 'Alt+8 — Settings  |  Ctrl+Shift+H — Hide',
  },
  ru: {
    fps: 'ФПС',
    ping: 'ПИНГ',
    hint: 'Alt+8 — Настройки  |  Ctrl+Shift+H — Скрыть',
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
const fpsEl = document.getElementById('fps-value');
const pingEl = document.getElementById('ping-value');
const cpuBar = document.getElementById('cpu-bar');
const cpuValue = document.getElementById('cpu-value');
const memBar = document.getElementById('mem-bar');
const memValue = document.getElementById('mem-value');
const statusDot = document.getElementById('roblox-status');
const killFeed = document.getElementById('kill-feed');

// ── FPS counter (overlay's own framerate as fallback) ────────────────
let overlayFps = 0;
let frames = 0;
let lastFpsTime = performance.now();

function fpsLoop() {
  frames++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    overlayFps = frames;
    frames = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(fpsLoop);
}
requestAnimationFrame(fpsLoop);

// ── FPS color coding ─────────────────────────────────────────────────
function setFpsColor(el, fps) {
  el.classList.remove('value-good', 'value-warn', 'value-bad');
  if (fps >= 45) el.classList.add('value-good');
  else if (fps >= 25) el.classList.add('value-warn');
  else el.classList.add('value-bad');
}

// ── Roblox real data ─────────────────────────────────────────────────
let robloxConnected = false;
let lastRobloxFps = null;
let lastRobloxPing = null;

window.kairozun.onRobloxData((data) => {
  robloxConnected = data.running;
  statusDot.classList.toggle('offline', !data.running);
  statusDot.title = data.running ? 'Roblox: Online' : 'Roblox: Offline';

  if (data.fps != null) {
    lastRobloxFps = data.fps;
    fpsEl.textContent = data.fps;
    setFpsColor(fpsEl, data.fps);
  }

  if (data.ping != null) {
    lastRobloxPing = data.ping;
    pingEl.textContent = data.ping + ' ms';
  }
});

// Fallback: if no Roblox data, show overlay FPS
setInterval(() => {
  if (!robloxConnected || lastRobloxFps == null) {
    fpsEl.textContent = overlayFps;
    setFpsColor(fpsEl, overlayFps);
  }
  if (!robloxConnected || lastRobloxPing == null) {
    pingEl.textContent = '--';
  }
}, 1000);

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
    document.getElementById('panel-bl').classList.toggle('hidden', !settings.showSystem);
  }
  if (settings.showKillFeed !== undefined) {
    document.getElementById('panel-tr').classList.toggle('hidden', !settings.showKillFeed);
  }
  if (settings.username) {
    document.getElementById('username').textContent = settings.username;
    document.getElementById('avatar-letter').textContent = settings.username.charAt(0).toUpperCase();
  }
});

// Initial language
applyLang('en');
