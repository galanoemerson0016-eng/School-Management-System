const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const fs = require('fs');
const licenseManager = require('./license.cjs');

const isDev = process.env.NODE_ENV === 'development';

// --- Persistent logging (userData/logs/main.log) ---
// The renderer console is stripped in production builds, so this file is the
// only place failures from the field can be diagnosed.
let log = console;
try {
  log = require('electron-log');
  log.initialize();
  log.transports.file.maxSize = 5 * 1024 * 1024; // rotate at 5MB
  log.errorHandler.startCatching(); // uncaughtException / unhandledRejection in main
  log.info(`FormEase Pro starting (v${app.getVersion()}, electron ${process.versions.electron}, ${process.platform})`);
} catch (e) {
  console.warn('electron-log unavailable, falling back to console:', e);
}

let autoUpdater;
let isQuitting = false;
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

    mainWindow.on('close', (e) => {
      if (!isQuitting) {
        e.preventDefault();
        mainWindow.webContents.send('app-close-requested');
      }
    });

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

    // Background license re-verification: if the licensing service reports
    // this serial as revoked or rebound to another machine, drop the local
    // license and notify the renderer so it returns to the activation screen.
    setTimeout(() => {
      licenseManager.verifyOnline().then((result) => {
        if (result.revoked) {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('license-revoked');
          }
        }
      }).catch(() => { /* offline or transient — keep local verdict */ });
    }, 5000);

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
  });

  // Any programmatic quit (e.g. autoUpdater.quitAndInstall) must bypass the
  // window close interception, otherwise the quit is silently cancelled and
  // the update installer never runs.
  app.on('before-quit', () => {
    isQuitting = true;
  });
}

// --- IPC Handlers ---

// --- Renderer error logging ---
// Global error/unhandledrejection handlers in the renderer forward here so
// failures persist to the log file even though prod builds strip console.
ipcMain.on('log-renderer-error', (event, payload = {}) => {
  try {
    const { kind, message, stack } = payload;
    log.error(`[renderer:${kind || 'error'}] ${String(message).slice(0, 2000)}`);
    if (stack) log.error(String(stack).slice(0, 4000));
  } catch {
    // never let logging take the app down
  }
});

// --- License IPC (verdict is computed in the main process only) ---

ipcMain.handle('license:status', () => {
  return licenseManager.getStatus();
});

ipcMain.handle('license:activate', async (event, { serial, fullName, platform } = {}) => {
  try {
    return await licenseManager.activate(serial, fullName, platform);
  } catch (error) {
    return { success: false, error: error.message || 'Activation failed.' };
  }
});

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
  // Install a downloaded update when the user quits, so the "Later" path
  // actually applies the update on next launch as the dialog promises.
  autoUpdater.autoInstallOnAppQuit = true;

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
        isQuitting = true;
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

ipcMain.on('close-app', (event, force = false) => {
  if (force) {
    isQuitting = true;
    app.quit();
  } else {
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      windows[0].close();
    } else {
      app.quit();
    }
  }
});

ipcMain.on('minimize-app', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (focusedWindow) focusedWindow.minimize();
});

ipcMain.on('maximize-app', () => {
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (focusedWindow) {
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  }
});

ipcMain.handle('print-to-pdf', async (event, { defaultFilename, autoSave = false, landscape, pageSize } = {}) => {
  const focusedWindow = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (!focusedWindow) {
    return { success: false, error: 'No active window found' };
  }

  try {
    let filePath;
    const safeFilename = path.basename(defaultFilename || 'document.pdf');

    if (autoSave) {
      // Auto-save to Downloads folder without showing dialog
      filePath = path.join(app.getPath('downloads'), safeFilename);
    } else {
      // Show save dialog
      const { dialog } = require('electron');
      const { filePath: selectedPath, canceled } = await dialog.showSaveDialog(focusedWindow, {
        title: 'Save PDF File',
        defaultPath: path.join(focusedWindow.webContents.isDevToolsOpened() ? __dirname : app.getPath('downloads'), safeFilename),
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] }
        ]
      });

      if (canceled || !selectedPath) {
        return { success: false, error: 'Save canceled by user' };
      }

      filePath = selectedPath;
    }

    const options = {
      margins: {
        marginType: 'default'
      },
      printBackground: true,
      preferCSSPageSize: true
    };

    if (landscape !== undefined) {
      options.landscape = landscape;
    }
    if (pageSize !== undefined) {
      options.pageSize = pageSize;
    }

    const data = await focusedWindow.webContents.printToPDF(options);
    fs.writeFileSync(filePath, data);

    return { success: true, filePath };
  } catch (error) {
    console.error('printToPDF failed:', error);
    return { success: false, error: error.message };
  }
});
