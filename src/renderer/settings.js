/* ════════════════════════════════════════════════════════════════════
   Kairozun Settings — Renderer Logic (Sidebar + Tabs)
   ════════════════════════════════════════════════════════════════════ */

// ── i18n ─────────────────────────────────────────────────────────────
const i18n = {
  en: {
    settingsTitle: 'Settings',
    language: 'Language',
    navGeneral: 'General',
    navWidgets: 'Widgets',
    navRoblox: 'Roblox',
    navSystem: 'System',
    navAbout: 'About',
    widgetsPerformance: 'Performance',
    widgetsRoblox: 'Roblox Info',
    widgetsOther: 'Other',
    showFps: 'Show FPS',
    showPing: 'Show Ping',
    showAccount: 'Show Account',
    showFriends: 'Show Friends',
    showGame: 'Show Game Info',
    showPlayers: 'Show Players',
    showServerIp: 'Show Server IP',
    showVisits: 'Show Visits',
    showFavorites: 'Show Favorites',
    showKillFeed: 'Show Kill Feed',
    showGenre: 'Show Genre',
    showRating: 'Show Rating',
    showRegion: 'Show Server Region',
    showUptime: 'Show Server Uptime',
    showSystem: 'Show System Load',
    showClock: 'Show Clock',
    usernameLabel: 'Username',
    systemMonitor: 'System Monitor',
    sysHardware: 'Hardware',
    sysCpuModel: 'CPU',
    sysCores: 'Cores',
    sysGpu: 'GPU',
    sysMemory: 'Memory',
    sysTotal: 'Total',
    sysUsed: 'Used',
    sysFree: 'Free',
    sysAppMem: 'App Memory',
    sysDisk: 'Disk',
    sysNetwork: 'Network',
    sysInfo: 'System Info',
    sysHostname: 'Host',
    sysUptime: 'Uptime',
    hotkeys: 'Hotkeys',
    hotkeySettings: 'Open / Close Settings',
    hotkeyOverlay: 'Show / Hide Overlay',
    captureSettings: 'Screen Capture',
    showOnCapture: 'Show on screen recording',
    accountInfo: 'Account',
    currentGame: 'Current Game',
    serverInfo: 'Server',
    friends: 'Friends',
    followers: 'Followers',
    accountAge: 'Account',
    updated: 'Updated',
    region: 'Region',
    sessionTime: 'Session',
    aboutDesc: 'Roblox glass overlay with real-time game data, system monitoring, and draggable HUD panels.',
    scanDiscord: 'Scan to join Discord',
    navHistory: 'History',
    historyEmpty: 'No games recorded yet',
    navAppearance: 'Appearance',
    widgetScale: 'Widget Scale',
    scaleFpsPing: 'FPS & Ping',
    scaleGameInfo: 'Game Info',
    scaleSystem: 'System Load',
    scaleClock: 'Clock & Session',
    scalePlayerList: 'Player List',
    showPlayerList: 'Show Player List',
    overlayOpacity: 'Overlay Opacity',
    panelDarkness: 'Panel Darkness',
    accentColor: 'Accent Color',
    navPlayers: 'Players',
    playerSearch: 'Player Lookup',
    serverPlayersLabel: 'Server Players',
    notInGame: 'Not in game',
    loadingAvatars: 'Loading avatars...',
    avatarsUnavailable: 'Roblox API does not provide avatars. Use search above.',
    you: 'You',
    friend: 'Friend',
    groupsLabel: 'Groups',
    registered: 'Registered',
    banned: 'Banned',
    badgesOwned: 'owned',
    historyStarted: 'Started',
    historyEnded: 'Ended',
    historyDuration: 'Duration',
    historyRegion: 'Region',
    historyServer: 'Server',
    complianceTitle: 'Compliance & Safety',
    complianceText: 'Kairozun is a safe external overlay that does not violate Roblox Terms of Use. The application does not inject code into Roblox, does not modify game memory, does not automate gameplay, and does not provide unfair advantages. It only reads publicly available log files and uses official Roblox public APIs.',
    complianceNoInject: 'Does not inject code or modify Roblox',
    compliancePublicApi: 'Uses only official public Roblox APIs',
    complianceNoCheat: 'Does not automate gameplay or provide cheats',
    complianceExternal: 'Runs externally — does not touch game process',
    complianceNoAuth: 'Does not require or store Roblox credentials',
    linkRobloxTos: 'Roblox Terms of Use',
    linkCommunityStandards: 'Community Standards',
    statusInGame: 'In Game',
    statusOnline: 'Online',
    statusOffline: 'Offline',
    gameBadgesLabel: 'Game Badges',
    searchHistory: 'Search History',
    clearSearchHistory: 'Clear',
  },
  ru: {
    settingsTitle: 'Настройки',
    language: 'Язык',
    navGeneral: 'Общее',
    navWidgets: 'Виджеты',
    navRoblox: 'Роблокс',
    navSystem: 'Система',
    navAbout: 'О приложении',
    widgetsPerformance: 'Производительность',
    widgetsRoblox: 'Роблокс инфо',
    widgetsOther: 'Другое',
    showFps: 'Показать ФПС',
    showPing: 'Показать пинг',
    showAccount: 'Показать аккаунт',
    showFriends: 'Показать друзей',
    showGame: 'Показать игру',
    showPlayers: 'Показать игроков',
    showServerIp: 'Показать IP сервера',
    showVisits: 'Показать визиты',
    showFavorites: 'Показать избранное',
    showKillFeed: 'Показать килфид',
    showGenre: 'Показать жанр',
    showRating: 'Показать рейтинг',
    showRegion: 'Показать регион сервера',
    showUptime: 'Показать время на сервере',
    showSystem: 'Показать нагрузку',
    showClock: 'Показать часы',
    usernameLabel: 'Имя пользователя',
    systemMonitor: 'Монитор системы',
    sysHardware: 'Оборудование',
    sysCpuModel: 'Процессор',
    sysCores: 'Ядра',
    sysGpu: 'Видеокарта',
    sysMemory: 'Память',
    sysTotal: 'Всего',
    sysUsed: 'Используется',
    sysFree: 'Свободно',
    sysAppMem: 'Память приложения',
    sysDisk: 'Диск',
    sysNetwork: 'Сеть',
    sysInfo: 'Информация о системе',
    sysHostname: 'Хост',
    sysUptime: 'Время работы',
    hotkeys: 'Горячие клавиши',
    hotkeySettings: 'Открыть / Закрыть настройки',
    hotkeyOverlay: 'Показать / Скрыть оверлей',
    captureSettings: 'Захват экрана',
    showOnCapture: 'Показывать при записи экрана',
    accountInfo: 'Аккаунт',
    currentGame: 'Текущая игра',
    serverInfo: 'Сервер',
    friends: 'Друзья',
    followers: 'Подписчики',
    accountAge: 'Аккаунт',
    updated: 'Обновлено',
    region: 'Регион',
    sessionTime: 'Сессия',
    aboutDesc: 'Roblox стеклянный оверлей с игровыми данными в реальном времени, мониторингом системы и перетаскиваемыми HUD панелями.',
    scanDiscord: 'Сканируй, чтобы войти в Discord',
    navHistory: 'История',
    historyEmpty: 'Нет записанных игр',
    navAppearance: 'Внешний вид',
    widgetScale: 'Масштаб виджетов',
    scaleFpsPing: 'ФПС и пинг',
    scaleGameInfo: 'Инфо об игре',
    scaleSystem: 'Нагрузка',
    scaleClock: 'Часы и сессия',
    scalePlayerList: 'Список игроков',
    showPlayerList: 'Показать игроков на сервере',
    overlayOpacity: 'Прозрачность оверлея',
    panelDarkness: 'Затемнение панели',
    accentColor: 'Акцентный цвет',
    navPlayers: 'Игроки',
    playerSearch: 'Поиск игрока',
    serverPlayersLabel: 'Игроки на сервере',
    notInGame: 'Не в игре',
    loadingAvatars: 'Загрузка аватаров...',
    avatarsUnavailable: 'API Roblox не предоставляет аватары. Используйте поиск выше.',
    you: 'Вы',
    friend: 'Друг',
    groupsLabel: 'Группы',
    registered: 'Регистрация',
    banned: 'Забанен',
    badgesOwned: 'получено',
    historyStarted: 'Начало',
    historyEnded: 'Конец',
    historyDuration: 'Длительность',
    historyRegion: 'Регион',
    historyServer: 'Сервер',
    complianceTitle: 'Соответствие и безопасность',
    complianceText: 'Kairozun — безопасный внешний оверлей, который не нарушает Условия использования Roblox. Приложение не внедряет код в Roblox, не изменяет память игры, не автоматизирует геймплей и не предоставляет нечестных преимуществ. Оно лишь читает публично доступные лог-файлы и использует официальные публичные API Roblox.',
    complianceNoInject: 'Не внедряет код и не модифицирует Roblox',
    compliancePublicApi: 'Использует только официальные публичные API Roblox',
    complianceNoCheat: 'Не автоматизирует геймплей и не предоставляет читы',
    complianceExternal: 'Работает внешне — не затрагивает процесс игры',
    complianceNoAuth: 'Не требует и не хранит учётные данные Roblox',
    linkRobloxTos: 'Условия использования Roblox',
    linkCommunityStandards: 'Стандарты сообщества',
    statusInGame: 'В игре',
    statusOnline: 'Онлайн',
    statusOffline: 'Офлайн',
    gameBadgesLabel: 'Игровые достижения',
    searchHistory: 'История поиска',
    clearSearchHistory: 'Очистить',
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
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

// ── Tab Navigation ───────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    // Deactivate all tabs and buttons
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    // Activate clicked tab
    btn.classList.add('active');
    const tabId = 'tab-' + btn.dataset.tab;
    document.getElementById(tabId).classList.add('active');
    if (btn.dataset.tab === 'history') renderGameHistory();
  });
});

// ── Title bar controls ───────────────────────────────────────────────
document.getElementById('btn-close').addEventListener('click', () => window.kairozun.closeSettings());
document.getElementById('btn-min').addEventListener('click', () => window.kairozun.minimizeSettings());

// ── About links ──────────────────────────────────────────────────────
document.getElementById('link-github').addEventListener('click', () => window.kairozun.openExternal('https://github.com/skaisay/kairozun'));
document.getElementById('link-discord').addEventListener('click', () => window.kairozun.openExternal('https://discord.gg/hR3MHdKAzU'));
document.getElementById('link-roblox-tos').addEventListener('click', () => window.kairozun.openExternal('https://en.help.roblox.com/hc/en-us/articles/115004647846-Roblox-Terms-of-Use'));
document.getElementById('link-roblox-community').addEventListener('click', () => window.kairozun.openExternal('https://en.help.roblox.com/hc/en-us/articles/203313410-Roblox-Community-Standards'));

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
const chkAccount = document.getElementById('chk-account');
const chkFriends = document.getElementById('chk-friends');
const chkGame = document.getElementById('chk-game');
const chkPlayers = document.getElementById('chk-players');
const chkServer = document.getElementById('chk-server');
const chkVisits = document.getElementById('chk-visits');
const chkClock = document.getElementById('chk-clock');
const chkGenre = document.getElementById('chk-genre');
const chkRating = document.getElementById('chk-rating');
const chkFavs = document.getElementById('chk-favs');
const chkRegion = document.getElementById('chk-region');
const chkUptime = document.getElementById('chk-uptime');
const chkPlayerList = document.getElementById('chk-playerlist');
const chkCapture = document.getElementById('chk-capture');

[chkFps, chkPing, chkKill, chkSys, chkAccount, chkFriends, chkGame, chkPlayers, chkServer, chkVisits, chkClock, chkGenre, chkRating, chkFavs, chkRegion, chkUptime, chkPlayerList].forEach((el) => el.addEventListener('change', pushSettings));

// Screen capture toggle
chkCapture.addEventListener('change', () => {
  window.kairozun.setCaptureMode(chkCapture.checked);
  pushSettings();
});

// ── Overlay Opacity slider ───────────────────────────────────────────
const overlayOpacitySlider = document.getElementById('overlay-opacity');
const overlayOpacityVal = document.getElementById('overlay-opacity-val');
let selectedAccentColor = '#6366f1';

overlayOpacitySlider.addEventListener('input', () => {
  overlayOpacityVal.textContent = Math.round(overlayOpacitySlider.value * 100) + '%';
  pushSettings();
});

// ── Accent color swatches ────────────────────────────────────────────
document.querySelectorAll('.color-swatch').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedAccentColor = btn.dataset.color;
    pushSettings();
  });
});

// ── Scale sliders ────────────────────────────────────────────────────
const scaleTL = document.getElementById('scale-tl');
const scaleTR = document.getElementById('scale-tr');
const scaleBL = document.getElementById('scale-bl');
const scaleBR = document.getElementById('scale-br');
const scaleML = document.getElementById('scale-ml');

[scaleTL, scaleTR, scaleBL, scaleBR, scaleML].forEach((el) => {
  if (el) el.addEventListener('input', () => {
    document.getElementById(el.id + '-val').textContent = parseFloat(el.value).toFixed(1) + 'x';
    pushSettings();
  });
});

// ── Restore saved settings ───────────────────────────────────────────
const _saved = window.kairozun.getSettings();
if (_saved) {
  if (_saved.lang) applyLang(_saved.lang);
  if (_saved.showFps !== undefined) chkFps.checked = _saved.showFps;
  if (_saved.showPing !== undefined) chkPing.checked = _saved.showPing;
  if (_saved.showKillFeed !== undefined) chkKill.checked = _saved.showKillFeed;
  if (_saved.showSystem !== undefined) chkSys.checked = _saved.showSystem;
  if (_saved.showAccount !== undefined) chkAccount.checked = _saved.showAccount;
  if (_saved.showFriends !== undefined) chkFriends.checked = _saved.showFriends;
  if (_saved.showGame !== undefined) chkGame.checked = _saved.showGame;
  if (_saved.showPlayers !== undefined) chkPlayers.checked = _saved.showPlayers;
  if (_saved.showServer !== undefined) chkServer.checked = _saved.showServer;
  if (_saved.showVisits !== undefined) chkVisits.checked = _saved.showVisits;
  if (_saved.showClock !== undefined) chkClock.checked = _saved.showClock;
  if (_saved.showGenre !== undefined) chkGenre.checked = _saved.showGenre;
  if (_saved.showRating !== undefined) chkRating.checked = _saved.showRating;
  if (_saved.showFavorites !== undefined) chkFavs.checked = _saved.showFavorites;
  if (_saved.showRegion !== undefined) chkRegion.checked = _saved.showRegion;
  if (_saved.showUptime !== undefined) chkUptime.checked = _saved.showUptime;
  if (_saved.showPlayerList !== undefined) chkPlayerList.checked = _saved.showPlayerList;
  if (_saved.showOnCapture !== undefined) chkCapture.checked = _saved.showOnCapture;
  if (_saved.scaleTL !== undefined && scaleTL) scaleTL.value = _saved.scaleTL;
  if (_saved.scaleTR !== undefined && scaleTR) scaleTR.value = _saved.scaleTR;
  if (_saved.scaleBL !== undefined && scaleBL) scaleBL.value = _saved.scaleBL;
  if (_saved.scaleBR !== undefined && scaleBR) scaleBR.value = _saved.scaleBR;
  if (_saved.scaleML !== undefined && scaleML) scaleML.value = _saved.scaleML;
  [scaleTL, scaleTR, scaleBL, scaleBR, scaleML].forEach(el => {
    if (el) document.getElementById(el.id + '-val').textContent = parseFloat(el.value).toFixed(1) + 'x';
  });
  if (_saved.overlayOpacity !== undefined) {
    overlayOpacitySlider.value = _saved.overlayOpacity;
    overlayOpacityVal.textContent = Math.round(_saved.overlayOpacity * 100) + '%';
  }
  if (_saved.accentColor) {
    selectedAccentColor = _saved.accentColor;
    document.querySelectorAll('.color-swatch').forEach(b => {
      b.classList.toggle('active', b.dataset.color === selectedAccentColor);
    });
  }
}

function pushSettings() {
  window.kairozun.updateSettings({
    lang: currentLang,
    showFps: chkFps.checked,
    showPing: chkPing.checked,
    showKillFeed: chkKill.checked,
    showSystem: chkSys.checked,
    showAccount: chkAccount.checked,
    showFriends: chkFriends.checked,
    showGame: chkGame.checked,
    showPlayers: chkPlayers.checked,
    showServer: chkServer.checked,
    showVisits: chkVisits.checked,
    showClock: chkClock.checked,
    showGenre: chkGenre.checked,
    showRating: chkRating.checked,
    showFavorites: chkFavs.checked,
    showRegion: chkRegion.checked,
    showUptime: chkUptime.checked,
    showPlayerList: chkPlayerList.checked,
    showOnCapture: chkCapture.checked,
    scaleTL: scaleTL ? parseFloat(scaleTL.value) : 1,
    scaleTR: scaleTR ? parseFloat(scaleTR.value) : 1,
    scaleBL: scaleBL ? parseFloat(scaleBL.value) : 1,
    scaleBR: scaleBR ? parseFloat(scaleBR.value) : 1,
    scaleML: scaleML ? parseFloat(scaleML.value) : 1,
    overlayOpacity: parseFloat(overlayOpacitySlider.value),
    accentColor: selectedAccentColor,
  });
}

// ── System Metrics ───────────────────────────────────────────────────
const cpuBar = document.getElementById('cpu-bar');
const cpuValue = document.getElementById('cpu-value');
const memBar = document.getElementById('mem-bar');
const memValue = document.getElementById('mem-value');

// Extended system elements
const sysCpuModel = document.getElementById('sys-cpu-model');
const sysCpuCores = document.getElementById('sys-cpu-cores');
const sysGpuName = document.getElementById('sys-gpu-name');
const sysGpuVram = document.getElementById('sys-gpu-vram');
const sysMemTotal = document.getElementById('sys-mem-total');
const sysMemUsed = document.getElementById('sys-mem-used');
const sysMemFree = document.getElementById('sys-mem-free');
const sysAppMem = document.getElementById('sys-app-mem');
const sysDisks = document.getElementById('sys-disks');
const sysNetwork = document.getElementById('sys-network');
const sysOs = document.getElementById('sys-os');
const sysHostname = document.getElementById('sys-hostname');
const sysUptime = document.getElementById('sys-uptime');

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function renderDisks(disks) {
  if (!disks || !disks.length) { sysDisks.textContent = '--'; return; }
  sysDisks.innerHTML = disks.map(d => {
    const usedGB = (d.totalGB - d.freeGB).toFixed(1);
    const pct = Math.round(((d.totalGB - d.freeGB) / d.totalGB) * 100);
    return `<div class="sys-info-item">
      <span class="sys-label">${d.drive}</span>
      <span class="sys-val">${usedGB} / ${d.totalGB} GB (${pct}%)</span>
    </div>`;
  }).join('');
}

function renderNetwork(nets) {
  if (!nets || !nets.length) { sysNetwork.textContent = '--'; return; }
  sysNetwork.innerHTML = nets.map(n =>
    `<div class="sys-info-item">
      <span class="sys-label">${n.name}</span>
      <span class="sys-val">${n.ip}</span>
    </div>`
  ).join('');
}

// Static system info (sent once)
window.kairozun.onSystemStatic((info) => {
  if (info.cpuModel) sysCpuModel.textContent = info.cpuModel;
  if (info.cpuCores) sysCpuCores.textContent = info.cpuCores;
  if (info.gpu?.name) sysGpuName.textContent = info.gpu.name;
  if (info.gpu?.vram) sysGpuVram.textContent = info.gpu.vram + ' MB';
  if (info.osVersion) sysOs.textContent = info.osVersion;
  if (info.hostname) sysHostname.textContent = info.hostname;
  renderDisks(info.disks);
});

// Disk updates (every 60s)
window.kairozun.onSystemDisks((disks) => {
  renderDisks(disks);
});

// Dynamic metrics (every 3s)
window.kairozun.onSystemMetrics((m) => {
  cpuBar.style.width = m.cpu + '%';
  cpuValue.textContent = m.cpu + '%';
  memBar.style.width = m.mem + '%';
  memValue.textContent = m.mem + '%';

  if (m.totalMemGB != null) sysMemTotal.textContent = m.totalMemGB + ' GB';
  if (m.usedMemGB != null) sysMemUsed.textContent = m.usedMemGB + ' GB';
  if (m.freeMemGB != null) sysMemFree.textContent = m.freeMemGB + ' GB';
  if (m.appMemMB != null) sysAppMem.textContent = m.appMemMB + ' MB';
  if (m.uptime != null) sysUptime.textContent = formatUptime(m.uptime);
  if (m.network) renderNetwork(m.network);
});

// ── Roblox Data Display in Settings ──────────────────────────────────
function formatNumber(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function formatAccountAge(dateStr) {
  if (!dateStr) return '--';
  const created = new Date(dateStr);
  const now = new Date();
  const years = Math.floor((now - created) / (365.25 * 24 * 60 * 60 * 1000));
  if (years >= 1) return years + 'y';
  const months = Math.floor((now - created) / (30.44 * 24 * 60 * 60 * 1000));
  return months + 'mo';
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const locale = currentLang === 'ru' ? 'ru-RU' : 'en-US';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

window.kairozun.onRobloxData((data) => {
  // Account card
  const t = i18n[currentLang] || i18n.en;
  const statusBadge = document.getElementById('rbx-status-badge');
  if (data.running) {
    if (data.inGame) {
      statusBadge.textContent = t.statusInGame || 'In Game';
      statusBadge.className = 'roblox-status-badge in-game';
    } else {
      statusBadge.textContent = t.statusOnline || 'Online';
      statusBadge.className = 'roblox-status-badge online';
    }
  } else {
    statusBadge.textContent = t.statusOffline || 'Offline';
    statusBadge.className = 'roblox-status-badge';
  }

  if (data.displayName) {
    document.getElementById('rbx-display-name').textContent = data.displayName;
  }
  if (data.username) {
    document.getElementById('rbx-username').textContent = '@' + data.username;
    document.getElementById('rbx-avatar-letter').textContent = data.username.charAt(0).toUpperCase();
  }
  if (data.avatarUrl) {
    const img = document.getElementById('rbx-avatar');
    if (img.src !== data.avatarUrl) {
      img.src = data.avatarUrl;
    }
    // Use load/error events instead of immediate show
    img.onload = () => { img.classList.remove('hidden'); document.getElementById('rbx-avatar-letter').classList.add('hidden'); };
    img.onerror = () => { img.classList.add('hidden'); document.getElementById('rbx-avatar-letter').classList.remove('hidden'); };
  }
  if (data.friendsCount != null) {
    document.getElementById('rbx-friends').textContent = data.friendsCount;
  }
  if (data.hasVerifiedBadge != null) {
    document.getElementById('rbx-verified').textContent = data.hasVerifiedBadge ? '✓' : '✗';
  }
  if (data.accountCreated) {
    document.getElementById('rbx-account-age').textContent = formatAccountAge(data.accountCreated);
  }

  // Game card
  const notInGame = !data.running || (data.running && !data.inGame);
  if (data.gameName && data.inGame) {
    document.getElementById('rbx-game-title').textContent = data.gameName;
  } else if (notInGame) {
    document.getElementById('rbx-game-title').textContent = t.notInGame || 'Not in game';
  }
  if (data.lastLocation && data.inGame) {
    document.getElementById('rbx-game-sub').textContent = data.lastLocation;
  }
  if (data.gameIcon) {
    const icon = document.getElementById('rbx-game-icon');
    if (icon.src !== data.gameIcon) {
      icon.src = data.gameIcon;
      icon.classList.remove('hidden');
    }
  }
  if (data.gamePlaying != null) {
    document.getElementById('rbx-game-playing').textContent = formatNumber(data.gamePlaying);
  }
  if (data.gameVisits != null) {
    document.getElementById('rbx-game-visits').textContent = formatNumber(data.gameVisits);
  }
  if (data.gameFavorites != null) {
    document.getElementById('rbx-game-favs').textContent = formatNumber(data.gameFavorites);
  }
  if (data.gameRating != null) {
    document.getElementById('rbx-game-rating').textContent = data.gameRating + '%';
  }
  if (data.gameGenre) {
    document.getElementById('rbx-game-genre').textContent = data.gameGenre;
  }
  if (data.gameCreator) {
    document.getElementById('rbx-game-creator').textContent = data.gameCreator;
  }
  if (data.gameUpdated) {
    document.getElementById('rbx-game-updated').textContent = formatDate(data.gameUpdated);
  }
  if (data.followersCount != null) {
    document.getElementById('rbx-followers').textContent = formatNumber(data.followersCount);
  }
  if (data.universeId) {
    document.getElementById('rbx-universe-id').textContent = data.universeId;
  }
  if (data.serverRegion) {
    document.getElementById('rbx-region').textContent = data.serverRegion;
  }
  if (data.serverJoinTime) {
    const elapsed = Math.floor((Date.now() - new Date(data.serverJoinTime).getTime()) / 1000);
    if (elapsed >= 0) {
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      document.getElementById('rbx-session-time').textContent = h > 0
        ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
        : m + ':' + String(s).padStart(2, '0');
    }
  }

  // Server info
  if (data.serverIp) {
    document.getElementById('rbx-server-ip').textContent = data.serverIp;
  }
  if (data.ping != null) {
    document.getElementById('rbx-ping-val').textContent = data.ping + ' ms';
  }
  if (data.serverPlayerCount != null) {
    document.getElementById('rbx-server-players').textContent = data.serverPlayerCount + (data.serverMaxPlayers ? ' / ' + data.serverMaxPlayers : '');
  }
  if (data.serverFps != null) {
    document.getElementById('rbx-server-fps').textContent = data.serverFps;
  }
  if (data.totalServers != null) {
    document.getElementById('rbx-total-servers').textContent = data.totalServers;
  }
  if (data.placeId) {
    document.getElementById('rbx-place-id').textContent = data.placeId;
  }

  // Server players grid in Players tab
  const spGrid = document.getElementById('server-players-grid');
  const spOffline = document.getElementById('server-players-offline');
  const spCounter = document.getElementById('server-players-counter');
  if (data.running && data.serverPlayerCount > 0) {
    spOffline.classList.add('hidden');
    const count = data.serverPlayerCount;
    const max = data.serverMaxPlayers || '?';
    spCounter.textContent = '(' + count + '/' + max + ')';
    const list = data.serverPlayerList || [];
    const knownIds = list.map(p => p.userId).join(',');
    const key = 'pl-' + count + '-' + knownIds;
    if (spGrid.dataset.key !== key) {
      spGrid.dataset.key = key;
      spGrid.innerHTML = '';
      const frag = document.createDocumentFragment();

      // Render known players (self + friends on server)
      for (const p of list) {
        const row = document.createElement('div');
        row.className = 'server-player-row';
        if (p.avatarUrl) {
          const img = document.createElement('img');
          img.className = 'server-player-row-avatar';
          img.src = p.avatarUrl;
          img.alt = '';
          row.appendChild(img);
        } else {
          const ph = document.createElement('div');
          ph.className = 'server-player-placeholder';
          ph.textContent = p.displayName ? p.displayName[0].toUpperCase() : '?';
          row.appendChild(ph);
        }
        const label = document.createElement('span');
        label.className = 'server-player-row-name';
        label.textContent = p.displayName || p.username;
        if (p.isSelf) label.style.color = '#a78bfa';
        if (p.isFriend) label.style.color = '#6ee7b7';
        row.appendChild(label);
        // Tag (You / Friend)
        if (p.isSelf || p.isFriend) {
          const tag = document.createElement('span');
          tag.className = 'server-player-row-tag';
          const t = i18n[currentLang] || i18n.en;
          tag.textContent = p.isSelf ? (t.you || 'You') : (t.friend || 'Friend');
          row.appendChild(tag);
        }
        // Eye button for profile
        const eye = document.createElement('button');
        eye.className = 'server-player-row-eye';
        eye.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
        eye.title = p.username;
        eye.addEventListener('click', () => {
          doPlayerLookup(p.username);
          // Scroll to top of Players tab to see results
          document.getElementById('player-search-input').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        row.appendChild(eye);
        frag.appendChild(row);
      }

      // Render remaining unknown players as placeholders
      const remaining = count - list.length;
      const showPlaceholders = Math.min(remaining, 25);
      for (let i = 0; i < showPlaceholders; i++) {
        const row = document.createElement('div');
        row.className = 'server-player-row';
        const ph = document.createElement('div');
        ph.className = 'server-player-placeholder';
        ph.textContent = (list.length + i + 1);
        row.appendChild(ph);
        const label = document.createElement('span');
        label.className = 'server-player-row-name';
        label.textContent = 'Player #' + (list.length + i + 1);
        label.style.opacity = '0.4';
        row.appendChild(label);
        frag.appendChild(row);
      }
      if (remaining > showPlaceholders) {
        const more = document.createElement('div');
        more.className = 'server-player-row server-player-row-more';
        more.textContent = '+' + (remaining - showPlaceholders);
        frag.appendChild(more);
      }
      spGrid.appendChild(frag);
    }
  } else if (!data.running || !data.inGame) {
    spOffline.classList.remove('hidden');
    spCounter.textContent = '';
    spGrid.innerHTML = '';
    spGrid.dataset.key = '';
  }

  // Reset when offline or not in game
  if (notInGame) {
    document.getElementById('rbx-server-ip').textContent = '--';
    document.getElementById('rbx-ping-val').textContent = '-- ms';
    document.getElementById('rbx-server-players').textContent = '--';
    document.getElementById('rbx-server-fps').textContent = '--';
    document.getElementById('rbx-total-servers').textContent = '--';
    document.getElementById('rbx-game-playing').textContent = '--';
    document.getElementById('rbx-game-rating').textContent = '--';
    document.getElementById('rbx-game-genre').textContent = '--';
    document.getElementById('rbx-game-creator').textContent = '--';
    document.getElementById('rbx-game-updated').textContent = '--';
    document.getElementById('rbx-region').textContent = '--';
    document.getElementById('rbx-session-time').textContent = '--';
    document.getElementById('rbx-game-icon').classList.add('hidden');
    document.getElementById('rbx-game-sub').textContent = '';
    document.getElementById('rbx-game-visits').textContent = '--';
    document.getElementById('rbx-game-favs').textContent = '--';
    document.getElementById('rbx-followers').textContent = '--';
    document.getElementById('rbx-universe-id').textContent = '--';
    document.getElementById('rbx-place-id').textContent = '--';
  }
});

// Init
if (!_saved || !_saved.lang) applyLang('en');

// ── Hotkey Rebinding ────────────────────────────────────────────────────────
const hotkeyModal = document.getElementById('hotkey-modal');
const hotkeyComboEl = document.getElementById('hotkey-modal-combo');
const hotkeySaveBtn = document.getElementById('hotkey-modal-save');
const hotkeyCancelBtn = document.getElementById('hotkey-modal-cancel');
let currentHotkeyAction = null;
let recordedAccelerator = null;

// Restore saved hotkeys
if (_saved && _saved.hotkeySettings) {
  document.getElementById('hotkey-settings').textContent = _saved.hotkeySettings.replace('CommandOrControl', 'Ctrl');
}
if (_saved && _saved.hotkeyOverlay) {
  document.getElementById('hotkey-overlay').textContent = _saved.hotkeyOverlay.replace('CommandOrControl', 'Ctrl');
}

function keyEventToAccelerator(e) {
  const parts = [];
  if (e.ctrlKey) parts.push('CommandOrControl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const code = e.code;
  const key = e.key;
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) return null;
  if (key === 'Escape') return null;
  // Use e.code for reliable key detection (layout-independent)
  if (/^Key[A-Z]$/.test(code)) parts.push(code.slice(3)); // KeyA → A
  else if (/^Digit[0-9]$/.test(code)) parts.push(code.slice(5)); // Digit0 → 0
  else if (/^Numpad\d$/.test(code)) parts.push('num' + code.slice(6)); // Numpad0 → num0
  else if (/^F\d{1,2}$/.test(code)) parts.push(code); // F1-F12
  else if (code === 'Space') parts.push('Space');
  else if (code === 'Tab') parts.push('Tab');
  else if (code === 'Enter' || code === 'NumpadEnter') parts.push('Enter');
  else if (code === 'Backspace') parts.push('Backspace');
  else if (code === 'Delete') parts.push('Delete');
  else if (code === 'Insert') parts.push('Insert');
  else if (code === 'Home') parts.push('Home');
  else if (code === 'End') parts.push('End');
  else if (code === 'PageUp') parts.push('PageUp');
  else if (code === 'PageDown') parts.push('PageDown');
  else if (code === 'ArrowUp') parts.push('Up');
  else if (code === 'ArrowDown') parts.push('Down');
  else if (code === 'ArrowLeft') parts.push('Left');
  else if (code === 'ArrowRight') parts.push('Right');
  else if (code === 'Minus' || code === 'NumpadSubtract') parts.push('-');
  else if (code === 'Equal' || code === 'NumpadAdd') parts.push('=');
  else if (code === 'BracketLeft') parts.push('[');
  else if (code === 'BracketRight') parts.push(']');
  else if (code === 'Backslash') parts.push('\\');
  else if (code === 'Semicolon') parts.push(';');
  else if (code === 'Quote') parts.push("'");
  else if (code === 'Backquote') parts.push('`');
  else if (code === 'Period' || code === 'NumpadDecimal') parts.push('.');
  else if (code === 'Slash' || code === 'NumpadDivide') parts.push('/');
  else if (code === 'NumpadMultiply') parts.push('nummult');
  else return null;
  // Allow single-key bindings (letters, digits, F-keys, special keys)
  if (parts.length < 1) return null;
  return parts.join('+');
}

function openHotkeyModal(action) {
  currentHotkeyAction = action;
  recordedAccelerator = null;
  hotkeyComboEl.textContent = '—';
  hotkeyModal.classList.remove('hidden');
}

function closeHotkeyModal() {
  hotkeyModal.classList.add('hidden');
  currentHotkeyAction = null;
  recordedAccelerator = null;
}

document.querySelectorAll('.hotkey-btn').forEach(btn => {
  btn.addEventListener('click', () => openHotkeyModal(btn.dataset.action));
});

document.addEventListener('keydown', (e) => {
  if (hotkeyModal.classList.contains('hidden')) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') { closeHotkeyModal(); return; }
  const acc = keyEventToAccelerator(e);
  if (acc) {
    recordedAccelerator = acc;
    hotkeyComboEl.textContent = acc.replace('CommandOrControl', 'Ctrl');
  }
});

hotkeySaveBtn.addEventListener('click', () => {
  if (recordedAccelerator && currentHotkeyAction) {
    const btn = document.getElementById('hotkey-' + currentHotkeyAction);
    btn.textContent = recordedAccelerator.replace('CommandOrControl', 'Ctrl');
    window.kairozun.setHotkey(currentHotkeyAction, recordedAccelerator);
    // Persist via settings
    const settingsKey = currentHotkeyAction === 'settings' ? 'hotkeySettings' : 'hotkeyOverlay';
    const patch = {};
    patch[settingsKey] = recordedAccelerator;
    window.kairozun.updateSettings(patch);
  }
  closeHotkeyModal();
});

hotkeyCancelBtn.addEventListener('click', closeHotkeyModal);

// ── Game History ────────────────────────────────────────────────────────────
function escapeSettingsHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderGameHistory() {
  const list = document.getElementById('history-list');
  const history = window.kairozun.getGameHistory();
  const t = i18n[currentLang] || i18n.en;
  if (!history || history.length === 0) {
    list.innerHTML = '<div class="history-empty">' + (t.historyEmpty || 'No games recorded yet') + '</div>';
    return;
  }
  list.innerHTML = history.map((entry, idx) => {
    const dur = entry.duration || 0;
    const h = Math.floor(dur / 3600);
    const m = Math.floor((dur % 3600) / 60);
    const s = dur % 60;
    const timeStr = h > 0 ? h + 'h ' + m + 'm' : m + 'm';
    const fullDurStr = h > 0
      ? h + (currentLang === 'ru' ? 'ч ' : 'h ') + m + (currentLang === 'ru' ? 'м ' : 'm ') + s + (currentLang === 'ru' ? 'с' : 's')
      : m + (currentLang === 'ru' ? 'м ' : 'm ') + s + (currentLang === 'ru' ? 'с' : 's');
    const startDate = new Date(entry.startTime);
    const dateStr = startDate.toLocaleDateString();
    const timeOfDay = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endDate = new Date(startDate.getTime() + dur * 1000);
    const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return '<div class="history-entry-wrap">' +
      '<div class="history-entry" data-idx="' + idx + '">' +
        (entry.gameIcon ? '<img class="history-icon" src="' + escapeSettingsHtml(entry.gameIcon) + '" width="32" height="32">' : '<div class="history-icon-placeholder">?</div>') +
        '<div class="history-info">' +
          '<div class="history-name">' + escapeSettingsHtml(entry.gameName) + '</div>' +
          '<div class="history-meta">' + dateStr + ' ' + timeOfDay + ' \u2022 ' + timeStr + (entry.serverRegion ? ' \u2022 ' + escapeSettingsHtml(entry.serverRegion) : '') + '</div>' +
        '</div>' +
        '<button class="history-expand-btn" data-idx="' + idx + '"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>' +
        '<button class="history-delete-btn" data-idx="' + idx + '" title="Delete"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
      '</div>' +
      '<div class="history-detail" id="history-detail-' + idx + '">' +
        '<div class="history-detail-row"><span class="history-detail-label">' + (t.historyStarted || 'Started') + '</span><span>' + dateStr + ' ' + timeOfDay + '</span></div>' +
        '<div class="history-detail-row"><span class="history-detail-label">' + (t.historyEnded || 'Ended') + '</span><span>' + endDate.toLocaleDateString() + ' ' + endTimeStr + '</span></div>' +
        '<div class="history-detail-row"><span class="history-detail-label">' + (t.historyDuration || 'Duration') + '</span><span>' + fullDurStr + '</span></div>' +
        (entry.serverRegion ? '<div class="history-detail-row"><span class="history-detail-label">' + (t.historyRegion || 'Region') + '</span><span>' + escapeSettingsHtml(entry.serverRegion) + '</span></div>' : '') +
        (entry.serverIp ? '<div class="history-detail-row"><span class="history-detail-label">' + (t.historyServer || 'Server') + '</span><span class="mono">' + escapeSettingsHtml(entry.serverIp) + '</span></div>' : '') +
        (entry.placeId ? '<div class="history-detail-row"><span class="history-detail-label">Place ID</span><span class="mono">' + escapeSettingsHtml(String(entry.placeId)) + '</span></div>' : '') +
      '</div>' +
    '</div>';
  }).join('');
  // Expand/collapse event handlers
  list.querySelectorAll('.history-expand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = btn.dataset.idx;
      const detail = document.getElementById('history-detail-' + idx);
      const isOpen = detail.classList.contains('open');
      list.querySelectorAll('.history-detail.open').forEach(d => d.classList.remove('open'));
      list.querySelectorAll('.history-expand-btn.open').forEach(b => b.classList.remove('open'));
      if (!isOpen) {
        detail.classList.add('open');
        btn.classList.add('open');
      }
    });
  });
  // Delete entry event handlers
  list.querySelectorAll('.history-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.idx);
      window.kairozun.deleteHistoryEntry(idx);
      renderGameHistory();
    });
  });
}

// ── Player Lookup ───────────────────────────────────────────────────────────
const playerSearchInput = document.getElementById('player-search-input');
const playerSearchBtn = document.getElementById('player-search-btn');
const playerSearchError = document.getElementById('player-search-error');
let playerSearching = false;

function escapePlayerHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

async function doPlayerLookup(usernameParam) {
  const username = (typeof usernameParam === 'string' && usernameParam) ? usernameParam.trim() : playerSearchInput.value.trim();
  if (!username || playerSearching) return;
  playerSearchInput.value = username;
  playerSearching = true;
  playerSearchBtn.disabled = true;
  playerSearchError.classList.add('hidden');
  document.getElementById('player-result-section').classList.add('hidden');
  document.getElementById('player-groups-section').classList.add('hidden');
  document.getElementById('player-badges-section').classList.add('hidden');

  try {
    const result = await window.kairozun.lookupPlayer(username);
    if (result.error) {
      playerSearchError.textContent = result.error;
      playerSearchError.classList.remove('hidden');
      return;
    }

    // Profile card
    document.getElementById('player-display-name').textContent = result.displayName || result.username;
    document.getElementById('player-username').textContent = '@' + result.username;
    document.getElementById('player-id').textContent = result.userId;
    document.getElementById('player-avatar-letter').textContent = (result.username || '?').charAt(0).toUpperCase();

    const avatarImg = document.getElementById('player-avatar');
    const avatarLetter = document.getElementById('player-avatar-letter');
    if (result.avatarUrl) {
      avatarImg.src = result.avatarUrl;
      avatarImg.classList.remove('hidden');
      avatarLetter.classList.add('hidden');
    } else {
      avatarImg.classList.add('hidden');
      avatarLetter.classList.remove('hidden');
    }

    // Badges
    const verifiedEl = document.getElementById('player-verified');
    const bannedEl = document.getElementById('player-banned');
    verifiedEl.classList.toggle('hidden', !result.hasVerifiedBadge);
    bannedEl.classList.toggle('hidden', !result.isBanned);

    // Stats
    document.getElementById('player-friends').textContent = result.friendsCount != null ? formatNumber(result.friendsCount) : '--';
    document.getElementById('player-followers').textContent = result.followersCount != null ? formatNumber(result.followersCount) : '--';
    document.getElementById('player-age').textContent = formatAccountAge(result.created);
    document.getElementById('player-groups-count').textContent = result.groups ? result.groups.length : '--';
    document.getElementById('player-created').textContent = formatDate(result.created);

    // Description
    const descWrap = document.getElementById('player-description-wrap');
    const descText = document.getElementById('player-description');
    if (result.description) {
      descText.textContent = result.description;
      descWrap.classList.remove('hidden');
    } else {
      descWrap.classList.add('hidden');
    }

    document.getElementById('player-result-section').classList.remove('hidden');

    // Save to search history
    addToSearchHistory(result.username || username);

    // Groups
    const groupsList = document.getElementById('player-groups-list');
    if (result.groups && result.groups.length > 0) {
      groupsList.innerHTML = result.groups.map(g =>
        '<div class="player-group-item">' +
          '<span class="player-group-name">' + escapePlayerHtml(g.name) + '</span>' +
          '<span class="player-group-role">' + escapePlayerHtml(g.role) + '</span>' +
        '</div>'
      ).join('');
      document.getElementById('player-groups-section').classList.remove('hidden');
    }

    // Game badges
    const t = i18n[currentLang] || i18n.en;
    if (result.gameBadges) {
      const label = document.getElementById('player-badges-label');
      label.textContent = (t.gameBadgesLabel || 'Game Badges') + ' (' + result.gameBadges.length + '/' + result.totalGameBadges + ' ' + (t.badgesOwned || 'owned') + ')';
      const badgesList = document.getElementById('player-badges-list');
      if (result.gameBadges.length > 0) {
        badgesList.innerHTML = result.gameBadges.map(b =>
          '<div class="player-badge-item">' +
            '<span class="player-badge-name">' + escapePlayerHtml(b.name) + '</span>' +
            '<span class="player-badge-date">' + formatDate(b.awardedDate) + '</span>' +
          '</div>'
        ).join('');
      } else {
        badgesList.innerHTML = '<div class="player-no-badges">0 / ' + result.totalGameBadges + '</div>';
      }
      document.getElementById('player-badges-section').classList.remove('hidden');
    }
  } catch {
    playerSearchError.textContent = 'Lookup failed';
    playerSearchError.classList.remove('hidden');
  } finally {
    playerSearching = false;
    playerSearchBtn.disabled = false;
  }
}

playerSearchBtn.addEventListener('click', () => doPlayerLookup());
playerSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doPlayerLookup();
});

// ── Player Search History ──────────────────────────────────────────────────
const SEARCH_HISTORY_KEY = 'kairozun_search_history';
const MAX_SEARCH_HISTORY = 10;

function loadSearchHistory() {
  try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []; } catch { return []; }
}

function saveSearchHistory(history) {
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SEARCH_HISTORY)));
}

function addToSearchHistory(username) {
  if (!username) return;
  let history = loadSearchHistory();
  history = history.filter(h => h.toLowerCase() !== username.toLowerCase());
  history.unshift(username);
  if (history.length > MAX_SEARCH_HISTORY) history.length = MAX_SEARCH_HISTORY;
  saveSearchHistory(history);
  renderSearchHistory();
}

function renderSearchHistory() {
  const container = document.getElementById('search-history-chips');
  const section = document.getElementById('search-history-section');
  const history = loadSearchHistory();
  const t = i18n[currentLang] || i18n.en;
  if (!history.length) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  document.getElementById('search-history-label').textContent = t.searchHistory || 'Search History';
  document.getElementById('search-history-clear').textContent = t.clearSearchHistory || 'Clear';
  container.innerHTML = history.map(name =>
    '<button class="search-history-chip" data-name="' + escapePlayerHtml(name) + '">' + escapePlayerHtml(name) + '</button>'
  ).join('');
  container.querySelectorAll('.search-history-chip').forEach(chip => {
    chip.addEventListener('click', () => doPlayerLookup(chip.dataset.name));
  });
}

document.getElementById('search-history-clear').addEventListener('click', () => {
  localStorage.removeItem(SEARCH_HISTORY_KEY);
  renderSearchHistory();
});

renderSearchHistory();
