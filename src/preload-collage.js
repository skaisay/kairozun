const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kairozun', {
  getCollageInit: () => ipcRenderer.sendSync('get-collage-init'),
  getScreenshots: () => ipcRenderer.invoke('get-screenshots'),
  readScreenshot: (filePath) => ipcRenderer.invoke('read-screenshot', filePath),
  saveEditedScreenshot: (data) => ipcRenderer.invoke('save-edited-screenshot', data),
  closeCollage: () => ipcRenderer.send('close-collage'),
});
