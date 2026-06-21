const { contextBridge, ipcRenderer, webFrame } = require('electron');

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
  saveAutoBackup: (data, filename) => ipcRenderer.invoke('save-auto-backup', { data, filename }),
  logError: (payload) => ipcRenderer.send('log-renderer-error', payload),
  licenseStatus: () => ipcRenderer.invoke('license:status'),
  licenseActivate: (payload) => ipcRenderer.invoke('license:activate', payload),
  licenseVerifyOnline: () => ipcRenderer.invoke('license:verify-online'),
  onLicenseRevoked: (callback) => {
    ipcRenderer.removeAllListeners('license-revoked');
    ipcRenderer.on('license-revoked', () => callback());
  },
  closeApp: (force = false) => ipcRenderer.send('close-app', force),
  onCloseRequested: (callback) => {
    ipcRenderer.removeAllListeners('app-close-requested');
    ipcRenderer.on('app-close-requested', () => callback());
  },
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  maximizeApp: () => ipcRenderer.send('maximize-app'),
  printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),
  readDbSalt: () => ipcRenderer.invoke('db:read-salt'),
  storeDbSalt: (saltHex) => ipcRenderer.invoke('db:store-salt', saltHex),
  verifyDiskSpace: () => ipcRenderer.invoke('db:verify-disk-space'),
  writePreUpdateState: (state) => ipcRenderer.invoke('db:write-pre-update-state', state),
  readPreUpdateState: () => ipcRenderer.invoke('db:read-pre-update-state'),
  clearPreUpdateState: () => ipcRenderer.invoke('db:clear-pre-update-state'),
  listFsBackups: () => ipcRenderer.invoke('list-fs-backups'),
  readFsBackupContent: (filename) => ipcRenderer.invoke('read-fs-backup-content', filename),
  deleteFsBackup: (filename) => ipcRenderer.invoke('delete-fs-backup', filename),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  quitAndInstall: () => ipcRenderer.send('quit-and-install'),
  gdriveAuthStart: (payload) => ipcRenderer.invoke('gdrive:auth-start', payload),
  gdriveStatus: () => ipcRenderer.invoke('gdrive:status'),
  gdriveDisconnect: () => ipcRenderer.invoke('gdrive:disconnect'),
  gdriveUploadBackup: (payload) => ipcRenderer.invoke('gdrive:upload-backup', payload),
  gdriveListBackups: () => ipcRenderer.invoke('gdrive:list-backups'),
  gdriveDownloadBackup: (fileId) => ipcRenderer.invoke('gdrive:download-backup', fileId),
  exportHtmlPdf: (data) => ipcRenderer.invoke('app:export-html-pdf', data),
});

// Setup dynamic keyboard and mouse scroll zoom controls
window.addEventListener('DOMContentLoaded', () => {
  console.log('FormEase Desktop Environment Ready');
  console.log(`Platform: ${process.platform}, Electron: ${process.versions.electron}`);

  // Keyboard zoom controls (Ctrl + / Ctrl - / Ctrl 0)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      const currentZoom = webFrame.getZoomFactor();
      
      // Ctrl + Plus/Equals (zoom in)
      if (e.key === '=' || e.key === '+' || e.keyCode === 187 || e.keyCode === 107) {
        e.preventDefault();
        webFrame.setZoomFactor(Math.min(3.0, currentZoom + 0.1));
      } 
      // Ctrl + Minus (zoom out)
      else if (e.key === '-' || e.keyCode === 189 || e.keyCode === 109) {
        e.preventDefault();
        webFrame.setZoomFactor(Math.max(0.5, currentZoom - 0.1));
      } 
      // Ctrl + Zero (reset zoom)
      else if (e.key === '0' || e.keyCode === 48 || e.keyCode === 96) {
        e.preventDefault();
        webFrame.setZoomFactor(1.0);
      }
    }
  });

  // Mouse wheel zoom controls (Ctrl + Scroll)
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const currentZoom = webFrame.getZoomFactor();
      let newZoom = currentZoom;
      
      if (e.deltaY < 0) {
        // Scroll up: zoom in
        newZoom = Math.min(3.0, currentZoom + 0.05);
      } else {
        // Scroll down: zoom out
        newZoom = Math.max(0.5, currentZoom - 0.05);
      }
      webFrame.setZoomFactor(newZoom);
    }
  }, { passive: false });
});
