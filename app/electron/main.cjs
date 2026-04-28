const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { machineIdSync } = require('node-machine-id');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
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

    // Prevent opening DevTools via keyboard shortcuts
    mainWindow.webContents.on('before-input-event', (event, input) => {
      const isControlOrMeta = process.platform === 'darwin' ? input.meta : input.control;
      const key = input.key.toLowerCase();

      if ((isControlOrMeta && input.shift && key === 'i') || 
          input.key === 'F12' ||
          (isControlOrMeta && input.shift && key === 'j') ||
          (isControlOrMeta && key === 'u')) {
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
function sendStatusToWindow(text) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send('update-message', text);
  }
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available! Downloading...');
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('App is up to date.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater: ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded. It will be installed on restart.');
});

ipcMain.on('check-for-updates', () => {
  autoUpdater.checkForUpdatesAndNotify();
});
