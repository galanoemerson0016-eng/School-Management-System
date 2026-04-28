const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  onUpdateMessage: (callback) => {
    // Remove previous listeners to prevent duplicates
    ipcRenderer.removeAllListeners('update-message');
    ipcRenderer.on('update-message', (_event, message) => callback(message));
  },
  saveAutoBackup: (data, filename) => ipcRenderer.invoke('save-auto-backup', { data, filename })
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('FormEase G7 Desktop Environment Ready');
  console.log(`Platform: ${process.platform}, Electron: ${process.versions.electron}`);
});
