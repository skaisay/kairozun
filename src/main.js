const { app, BrowserWindow, ipcMain, screen, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ICON_PATH = path.join(__dirname, '..', 'assets', 'icon.ico');

let overlayWindow = null;
let settingsWindow = null;
let tray = null;

// ── Roblox log reader ───────────────────────────────────────────────
const ROBLOX_LOG_DIR = path.join(os.homedir(), 'AppData', 'Local', 'Roblox', 'logs');

let lastLogFile = null;
let lastLogSize = 0;
let robloxRunning = false;
let robloxInterval = null;

function findLatestRobloxLog() {
  try {
    if (!fs.existsSync(ROBLOX_LOG_DIR)) return null;
    const files = fs.readdirSync(ROBLOX_LOG_DIR)
      .filter(f => f.endsWith('.log'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(ROBLOX_LOG_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return files.length > 0 ? path.join(ROBLOX_LOG_DIR, files[0].name) : null;
  } catch { return null; }
}

function parseRobloxLog(text) {
  const data = {};

  // FPS: look for "VideoMemoryBudgetKB" or "FPS" patterns
  const fpsMatch = text.match(/FLog::Graphics.*?(\d+(?:\.\d+)?)\s*fps/i)
    || text.match(/framerate\D+(\d+(?:\.\d+)?)/i)
    || text.match(/Fps:\s*(\d+(?:\.\d+)?)/i);
  if (fpsMatch) data.fps = Math.round(parseFloat(fpsMatch[1]));

  // Ping / latency
  const pingMatch = text.match(/averagePing[":=\s]+(\d+(?:\.\d+)?)/i)
    || text.match(/ping[":=\s]+(\d+(?:\.\d+)?)\s*ms/i)
    || text.match(/MachineAddress.*?(\d+(?:\.\d+)?)\s*ms/i)
    || text.match(/latency[":=\s]+(\d+(?:\.\d+)?)/i);
  if (pingMatch) data.ping = Math.round(parseFloat(pingMatch[1]));

  return data;
}

function isRobloxRunning() {
  try {
    const { execSync } = require('child_process');
    const result = execSync('tasklist /FI "IMAGENAME eq RobloxPlayerBeta.exe" /FO CSV /NH', {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000,
    });
    return result.includes('RobloxPlayerBeta');
  } catch { return false; }
}

function startRobloxWatcher() {
  robloxInterval = setInterval(() => {
    robloxRunning = isRobloxRunning();

    const robloxData = { running: robloxRunning };

    if (robloxRunning) {
      const logFile = findLatestRobloxLog();
      if (logFile) {
        try {
          const stat = fs.statSync(logFile);
          // Read only new data (tail)
          const readStart = Math.max(0, stat.size - 8192);
          const fd = fs.openSync(logFile, 'r');
          const buf = Buffer.alloc(stat.size - readStart);
          fs.readSync(fd, buf, 0, buf.length, readStart);
          fs.closeSync(fd);
          const chunk = buf.toString('utf8');
          Object.assign(robloxData, parseRobloxLog(chunk));
        } catch { /* ignore read errors */ }
      }
    }

    // Send to windows
    const send = (win) => {
      if (win && !win.isDestroyed()) win.webContents.send('roblox-data', robloxData);
    };
    send(overlayWindow);
    send(settingsWindow);
  }, 2000);
}

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
  startRobloxWatcher();

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
  if (robloxInterval) clearInterval(robloxInterval);
});

app.on('window-all-closed', (e) => {
  // Don't quit when settings window is closed — overlay stays
});
