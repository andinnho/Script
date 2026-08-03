const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  downloadAndUpdate: (downloadUrl) => ipcRenderer.invoke('download-and-install-update', downloadUrl),
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version')
});
