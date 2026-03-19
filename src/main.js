const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const os = require('os');

const ICON_PATH = path.join(__dirname, '..', 'assets', 'icon.ico');

let overlayWindow = null;
let settingsWindow = null;
let tray = null;

function createOverlay() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

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
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 520,
    height: 600,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    icon: ICON_PATH,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
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

function startSystemMetrics() {
  systemInterval = setInterval(() => {
    const cur = getCpuUsage();
    const idleDiff = cur.idle - prevCpu.idle;
    const totalDiff = cur.total - prevCpu.total;
    const cpuPercent = totalDiff === 0 ? 0 : Math.round((1 - idleDiff / totalDiff) * 100);
    prevCpu = cur;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('system-metrics', { cpu: cpuPercent, mem: memPercent });
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.webContents.send('system-metrics', { cpu: cpuPercent, mem: memPercent });
    }
  }, 1000);
}

// ── IPC handlers ────────────────────────────────────────────────────
ipcMain.on('update-settings', (_e, settings) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('apply-settings', settings);
  }
});

ipcMain.on('close-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
});

ipcMain.on('minimize-settings', () => {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.minimize();
});

// ── App lifecycle ───────────────────────────────────────────────────
app.whenReady().then(() => {
  createOverlay();
  startSystemMetrics();

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

  // Alt+8 — open/close settings
  globalShortcut.register('Alt+8', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    } else {
      createSettingsWindow();
    }
  });

  // Ctrl+Shift+H — toggle overlay visibility
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (overlayWindow.isVisible()) overlayWindow.hide();
      else overlayWindow.show();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (systemInterval) clearInterval(systemInterval);
});

app.on('window-all-closed', (e) => {
  // Don't quit when settings window is closed — overlay stays
});
