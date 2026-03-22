const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('kairozun', {
  getEditorInit: () => ipcRenderer.sendSync('get-editor-init'),
  readScreenshot: (filePath) => ipcRenderer.invoke('read-screenshot', filePath),
  saveEditedScreenshot: (data) => ipcRenderer.invoke('save-edited-screenshot', data),
  deleteScreenshot: (filePath) => ipcRenderer.invoke('delete-screenshot', filePath),
  closeEditor: () => ipcRenderer.send('close-editor'),
  pickImportPhoto: () => ipcRenderer.invoke('pick-import-photo'),
  getScreenshots: () => ipcRenderer.invoke('get-screenshots'),
});
