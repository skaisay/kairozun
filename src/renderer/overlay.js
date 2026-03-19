/* ════════════════════════════════════════════════════════════════════
   Kairozun Overlay — Renderer Logic
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

// ── FPS Counter ──────────────────────────────────────────────────────
const fpsEl = document.getElementById('fps-value');
let frames = 0;
let lastFpsTime = performance.now();

function fpsLoop() {
  frames++;
  const now = performance.now();
  if (now - lastFpsTime >= 1000) {
    fpsEl.textContent = frames;
    frames = 0;
    lastFpsTime = now;
  }
  requestAnimationFrame(fpsLoop);
}
requestAnimationFrame(fpsLoop);

// ── Simulated Ping ───────────────────────────────────────────────────
const pingEl = document.getElementById('ping-value');

function updatePing() {
  // In a real integration this would measure actual latency.
  // For the overlay demo we simulate a value.
  const ping = Math.floor(30 + Math.random() * 40);
  pingEl.textContent = ping + ' ms';
}
setInterval(updatePing, 2000);
updatePing();

// ── System Metrics (from main process) ───────────────────────────────
const cpuBar = document.getElementById('cpu-bar');
const cpuValue = document.getElementById('cpu-value');
const memBar = document.getElementById('mem-bar');
const memValue = document.getElementById('mem-value');

window.kairozun.onSystemMetrics(({ cpu, mem }) => {
  cpuBar.style.width = cpu + '%';
  cpuValue.textContent = cpu + '%';
  memBar.style.width = mem + '%';
  memValue.textContent = mem + '%';
});

// ── Kill Feed (demo) ─────────────────────────────────────────────────
const killFeed = document.getElementById('kill-feed');
const demoNames = ['xShadow', 'NoobSlayer', 'ProGamer42', 'BloxKing', 'NightWolf', 'StarBlitz', 'Kairozun'];
const MAX_KILLS = 5;

function addKillEntry(killer, victim) {
  const entry = document.createElement('div');
  entry.className = 'kill-entry';
  entry.innerHTML = `<span class="killer">${escapeHtml(killer)}</span> ⟶ <span class="victim">${escapeHtml(victim)}</span>`;
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

// Demo kill feed — remove in production
setInterval(() => {
  const k = demoNames[Math.floor(Math.random() * demoNames.length)];
  let v = demoNames[Math.floor(Math.random() * demoNames.length)];
  if (v === k) v = demoNames[(demoNames.indexOf(k) + 1) % demoNames.length];
  addKillEntry(k, v);
}, 4000);

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
  }
});

// Initial language
applyLang('en');
