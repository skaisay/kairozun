const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kairozun', {
  onSystemMetrics: (cb) => ipcRenderer.on('system-metrics', (_e, data) => cb(data)),
  onRobloxData: (cb) => ipcRenderer.on('roblox-data', (_e, data) => cb(data)),
  onApplySettings: (cb) => ipcRenderer.on('apply-settings', (_e, s) => cb(s)),
  updateSettings: (settings) => ipcRenderer.send('update-settings', settings),
  getSettings: () => ipcRenderer.sendSync('get-settings'),
  getGameHistory: () => ipcRenderer.sendSync('get-game-history'),
  lookupPlayer: (username) => ipcRenderer.invoke('lookup-player', username),
  closeSettings: () => ipcRenderer.send('close-settings'),
  minimizeSettings: () => ipcRenderer.send('minimize-settings'),
  setOverlayMouse: (ignore) => ipcRenderer.send('overlay-mouse', ignore),
  setHotkey: (action, accelerator) => ipcRenderer.send('set-hotkey', { action, accelerator }),
  openExternal: (url) => ipcRenderer.send('open-external', url),
});
