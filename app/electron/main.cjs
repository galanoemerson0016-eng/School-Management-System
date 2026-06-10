const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

let autoUpdater;
if (!isDev) {
  try {
    const { autoUpdater: au } = require('electron-updater');
    autoUpdater = au;
  } catch (e) {
    console.log('electron-updater not available');
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      if (windows[0].isMinimized()) windows[0].restore();
      windows[0].focus();
    }
  });

  function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    const mainWindow = new BrowserWindow({
      width: width,
      height: height,
      minWidth: 1024,
      minHeight: 768,
      fullscreen: true,
      icon: path.join(__dirname, '..', isDev ? 'public' : 'dist', 'app-logo.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
      },
      title: "FormEase Pro",
      autoHideMenuBar: true
    });

    // Hide the menu bar completely
    mainWindow.setMenuBarVisibility(false);

    if (isDev) {
      mainWindow.loadURL('http://localhost:3001');
    } else {
      // In production, load the built index.html
      const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
      mainWindow.loadFile(indexPath);
    }

    // Prevent opening DevTools or reloading via keyboard shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isControlOrMeta = process.platform === 'darwin' ? input.meta : input.control;
      const key = input.key.toLowerCase();

      if ((isControlOrMeta && input.shift && key === 'i') || 
          input.key === 'F12' ||
          (isControlOrMeta && input.shift && key === 'j') ||
          (isControlOrMeta && key === 'u') ||
          (isControlOrMeta && key === 'r') ||
          (isControlOrMeta && input.shift && key === 'r')) {
        event.preventDefault();
      }
    });
  }

  app.whenReady().then(() => {
    createWindow();

    // Check for updates after the app is ready (only in production)
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
      }, 3000);
    }

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });
}

// --- IPC Handlers ---

ipcMain.handle('get-machine-id', () => {
  try {
    return machineIdSync();
  } catch (error) {
    console.error('Failed to get machine ID:', error);
    return 'UNKNOWN-DEVICE';
  }
});

ipcMain.handle('save-auto-backup', async (event, { data, filename }) => {
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 10) {
      files.slice(10).forEach(f => {
        try {
          fs.unlinkSync(path.join(backupDir, f.name));
        } catch (e) {
          console.error('Failed to delete old backup:', e);
        }
      });
    }

    return { success: true, path: filePath };
  } catch (error) {
    console.error('Auto-backup failed:', error);
    return { success: false, error: error.message };
  }
});

// --- Auto Updater Logic ---
function sendStatusToWindow(text, status = 'info') {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-message', { text, status });
  }
}

if (autoUpdater) {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('checking-for-update', () => {
    sendStatusToWindow('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) of FormEase Pro is available. Would you like to download it now?`,
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        sendStatusToWindow('Downloading update...', 'downloading');
      } else {
        sendStatusToWindow('Update postponed.');
      }
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow('App is up to date.');
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    sendStatusToWindow('App is up to date.');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const speedMB = (progressObj.bytesPerSecond / (1024 * 1024)).toFixed(2);
    const percent = Math.round(progressObj.percent);
    const transferredMB = (progressObj.transferred / (1024 * 1024)).toFixed(1);
    const totalMB = (progressObj.total / (1024 * 1024)).toFixed(1);

    const message = `Downloading: ${percent}% (${transferredMB}MB / ${totalMB}MB) @ ${speedMB} MB/s`;
    sendStatusToWindow(message, 'progress');
  });

  autoUpdater.on('update-downloaded', (info) => {
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'The update has been downloaded and is ready to install. The app will restart now.',
      buttons: ['Install and Restart', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      } else {
        sendStatusToWindow('Update ready to install on next launch.');
      }
    });
  });

  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

ipcMain.on('close-app', () => {
  app.quit();
});
