const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kairozun', {
  onSystemMetrics: (cb) => ipcRenderer.on('system-metrics', (_e, data) => cb(data)),
  onApplySettings: (cb) => ipcRenderer.on('apply-settings', (_e, s) => cb(s)),
  updateSettings: (settings) => ipcRenderer.send('update-settings', settings),
  closeSettings: () => ipcRenderer.send('close-settings'),
  minimizeSettings: () => ipcRenderer.send('minimize-settings'),
});
