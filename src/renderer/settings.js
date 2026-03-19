/* ════════════════════════════════════════════════════════════════════
   Kairozun Settings — Renderer Logic
   ════════════════════════════════════════════════════════════════════ */

// ── i18n ─────────────────────────────────────────────────────────────
const i18n = {
  en: {
    settingsTitle: 'Settings',
    language: 'Language',
    widgets: 'Widgets',
    showFps: 'Show FPS',
    showPing: 'Show Ping',
    showKillFeed: 'Show Kill Feed',
    showSystem: 'Show System Load',
    usernameLabel: 'Username',
    systemMonitor: 'System Monitor',
  },
  ru: {
    settingsTitle: 'Настройки',
    language: 'Язык',
    widgets: 'Виджеты',
    showFps: 'Показать ФПС',
    showPing: 'Показать пинг',
    showKillFeed: 'Показать килфид',
    showSystem: 'Показать нагрузку',
    usernameLabel: 'Имя пользователя',
    systemMonitor: 'Монитор системы',
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
  // update lang buttons
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// ── Title bar controls ───────────────────────────────────────────────
document.getElementById('btn-close').addEventListener('click', () => window.kairozun.closeSettings());
document.getElementById('btn-min').addEventListener('click', () => window.kairozun.minimizeSettings());

// ── Language buttons ─────────────────────────────────────────────────
document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    applyLang(btn.dataset.lang);
    pushSettings();
  });
});

// ── Checkboxes & username ────────────────────────────────────────────
const chkFps = document.getElementById('chk-fps');
const chkPing = document.getElementById('chk-ping');
const chkKill = document.getElementById('chk-killfeed');
const chkSys = document.getElementById('chk-system');
const inputUsername = document.getElementById('input-username');

[chkFps, chkPing, chkKill, chkSys].forEach((el) => el.addEventListener('change', pushSettings));
inputUsername.addEventListener('input', pushSettings);

function pushSettings() {
  window.kairozun.updateSettings({
    lang: currentLang,
    showFps: chkFps.checked,
    showPing: chkPing.checked,
    showKillFeed: chkKill.checked,
    showSystem: chkSys.checked,
    username: inputUsername.value || 'Kairozun',
  });
}

// ── System Metrics ───────────────────────────────────────────────────
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

// Init
applyLang('en');
