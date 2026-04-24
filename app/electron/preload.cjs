const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // You can add IPC communication here if needed, e.g.:
  // sendMessage: (message) => ipcRenderer.send('message', message),
  // onMessage: (callback) => ipcRenderer.on('message', (_event, ...args) => callback(...args)),
  platform: process.platform,
  version: process.versions.electron,
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('FormEase G7 Desktop Environment Ready');
  console.log(`Platform: ${process.platform}, Electron: ${process.versions.electron}`);
});
