const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  downloadAndUpdate: (downloadUrl) => ipcRenderer.invoke('download-and-install-update', downloadUrl),
  getCurrentVersion: () => ipcRenderer.invoke('get-current-version'),
  sendAppReady: () => ipcRenderer.send('app-ready'),
  onSplashStatus: (callback) => ipcRenderer.on('splash-status', (event, data) => callback(data))
});
