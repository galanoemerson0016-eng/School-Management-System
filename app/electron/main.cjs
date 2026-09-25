const { app, BrowserWindow, ipcMain, screen, Menu } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const fs = require('fs');
const licenseManager = require('./license.cjs');
const { backupPath, readBackupFile, deleteBackupFile, saveBackupFile, saveBinaryBackupFile, rotateVerifiedBackupPairs, verifyStrongComprehensiveBackup, isInstallBackupReady } = require('./backup-files.cjs');

const isDev = process.env.NODE_ENV === 'development';

// Opt-in isolated profile for packaged-app verification. This must be set
// before Electron initializes logging, sessions, or any user-data path.
// It is intentionally unavailable unless a test harness supplies the path.
const isolatedTestUserDataDir = process.env.FORMEASE_TEST_USER_DATA_DIR;
if (isolatedTestUserDataDir) {
  const resolvedTestUserDataDir = path.resolve(isolatedTestUserDataDir);
  fs.mkdirSync(resolvedTestUserDataDir, { recursive: true });
  app.setPath('userData', resolvedTestUserDataDir);
  app.setPath('sessionData', path.join(resolvedTestUserDataDir, 'session-data'));
}

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
let downloadedUpdateReady = false;
let downloadedAt = 0;
let readyInstallBackupFilename = null;
let readyInstallBackupSavedAt = 0;

// electron-updater reads its production configuration from this packaged file.
// Local unpacked verification builds intentionally omit it, so an update check
// must be unavailable rather than becoming an unhandled startup rejection.
function hasPackagedUpdaterConfiguration() {
  if (!autoUpdater || !process.resourcesPath) return false;

  try {
    return fs.statSync(path.join(process.resourcesPath, 'app-update.yml')).isFile();
  } catch (_) {
    return false;
  }
}

function reportUpdaterCheckFailure(error, context = 'Update check failed') {
  const message = error?.message || String(error);
  console.error(`[AutoUpdater] ${context}:`, error);
  sendStatusToWindow({ type: 'update-error', message });
}

function checkForUpdatesSafely() {
  if (!hasPackagedUpdaterConfiguration()) {
    const message = 'Updates are unavailable because this package has no updater configuration.';
    console.info(`[AutoUpdater] ${message}`);
    sendStatusToWindow({ type: 'update-error', message });
    return Promise.resolve(null);
  }

  return Promise.resolve(autoUpdater.checkForUpdatesAndNotify()).catch((error) => {
    reportUpdaterCheckFailure(error);
    return null;
  });
}

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
      fullscreen: false,
      icon: process.platform === 'win32'
        ? path.join(__dirname, '..', isDev ? 'public' : 'dist', 'icon.ico')
        : path.join(__dirname, '..', isDev ? 'public' : 'dist', 'app-logo.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
        spellcheck: false,
        backgroundThrottling: false,
      },
      title: "FormEase Pro",
      autoHideMenuBar: true
    });

    mainWindow.maximize();

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

let expressServer = null;
global.expressServer = null;

// Hardware acceleration and GPU flags for smooth, lag-free rendering
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.formease.pro');
    }
    createWindow();

    // Start local Express server for Mobile Attendance Gateway
    try {
      const serverPath = path.join(__dirname, '..', 'server.js');
      // Vite owns port 3001 and provides the equivalent secured middleware in
      // development. Start the packaged Express gateway only in production.
      if (!isDev && fs.existsSync(serverPath)) {
        try {
          expressServer = require(serverPath);
          global.expressServer = expressServer;
          expressServer.startServer();
          if (log && log.info) log.info('[FormEase Pro] Mobile Gateway server started on port 3001');

          // Report a conflict without terminating an unrelated process that
          // happens to own the port.
          const srv = global.expressServer || expressServer;
          if (srv && srv.server) {
            srv.server.on('error', (err) => {
              if (err.code === 'EADDRINUSE') {
                const { dialog } = require('electron');
                dialog.showErrorBox(
                  'Network Port Conflict',
                  'FormEase Pro could not start the Mobile Attendance Gateway because Port 3001 is already in use.\n\nClose the application using that port, then restart FormEase Pro to enable mobile sync.'
                );
              }
            });
          }
        } catch (reqErr) {
          console.warn('[FormEase Pro] Express server startup notice:', reqErr.message || reqErr);
        }
      }
    } catch (err) {
      console.warn('[FormEase Pro] Express server init error:', err.message || err);
    }

    // Check for updates after the app is ready (only in production)
    if (!isDev && autoUpdater) {
      setTimeout(() => {
        void checkForUpdatesSafely();
      }, 3000);
    }

    // Background license re-verification: if the licensing service reports
    // this serial as revoked or rebound to another machine, drop the local
    // license and notify the renderer so it returns to the activation screen.
    const checkLicense = () => {
      licenseManager.verifyOnline().then((result) => {
        if (result.revoked) {
          const windows = BrowserWindow.getAllWindows();
          if (windows.length > 0) {
            windows[0].webContents.send('license-revoked');
          }
        }
      }).catch(() => { /* offline or transient — keep local verdict */ });
    };

    setTimeout(checkLicense, 5000);
    setInterval(checkLicense, 15 * 60 * 1000); // Re-verify every 15 minutes

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

ipcMain.handle('license:verify-online', async () => {
  try {
    return await licenseManager.verifyOnline();
  } catch (error) {
    return { revoked: false, error: error.message };
  }
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

ipcMain.handle('get-local-ip', () => {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name in interfaces) {
      const lowerName = name.toLowerCase();
      // Skip virtual adapters & virtual switches
      if (lowerName.includes('virtual') || lowerName.includes('vbox') || lowerName.includes('vmware') || lowerName.includes('vethernet') || lowerName.includes('pseudo') || lowerName.includes('hyper-v')) {
        continue;
      }
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (!iface.address.startsWith('169.254.')) {
            // Prioritize Wi-Fi or Wireless or Ethernet
            if (lowerName.includes('wi-fi') || lowerName.includes('wlan') || lowerName.includes('wireless') || lowerName.includes('ethernet')) {
              return iface.address;
            }
            candidates.push(iface.address);
          }
        }
      }
    }
    // Fallback: search all interfaces non-internal IPv4
    for (const name in interfaces) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    console.error('Failed to get local IP:', e);
  }
  return 'localhost';
});

ipcMain.handle('get-all-local-ips', () => {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const list = [];
    for (const name in interfaces) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
          list.push({ name, address: iface.address });
        }
      }
    }
    return list;
  } catch (e) {
    return [];
  }
});

ipcMain.handle('save-auto-backup', async (event, { data, filename, retentionLimit }) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const filePath = saveBackupFile(backupDir, filename, data, retentionLimit);
    if (downloadedUpdateReady && Date.now() >= downloadedAt &&
        typeof filename === 'string' && /^SMS_Backup_Comprehensive_prerestore_[A-Za-z0-9._-]+\.json$/.test(filename)) {
      if (!verifyStrongComprehensiveBackup(readBackupFile(backupDir, filename))) {
        throw new Error('The pre-install safety backup failed integrity verification.');
      }
      readyInstallBackupFilename = filename;
      readyInstallBackupSavedAt = Date.now();
    }
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Auto-backup failed:', error);
    return { success: false, error: error.message };
  }
});

// --- DB salt via safeStorage (OS-level encrypted keychain) ---
// The DB salt is 32 bytes of randomness persisted across app restarts.
// Keeping it in safeStorage prevents it from being extracted by a script
// that can read localStorage (e.g., a compromised renderer).
const SALT_FILE = 'formease-db-salt.enc';
const RECOVERY_DEK_FILE = 'formease-db-recovery-dek-v1.enc';

function isValidRawDek(value) {
  return typeof value === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(value) && Buffer.from(value, 'base64').length === 32;
}

ipcMain.handle('db:read-salt', async () => {
  const { safeStorage } = require('electron');
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    const saltPath = path.join(app.getPath('userData'), SALT_FILE);
    if (!fs.existsSync(saltPath)) return null;
    const buf = fs.readFileSync(saltPath);
    return safeStorage.decryptString(buf);
  } catch (err) {
    log.error('db:read-salt failed:', err);
    return 'DECRYPTION_FAILED';
  }
});

ipcMain.handle('db:store-salt', async (event, saltHex) => {
  const { safeStorage } = require('electron');
  if (!safeStorage.isEncryptionAvailable()) return false;
  try {
    const encrypted = safeStorage.encryptString(saltHex);
    const saltPath = path.join(app.getPath('userData'), SALT_FILE);
    fs.writeFileSync(saltPath, encrypted);
    return true;
  } catch (err) {
    log.error('db:store-salt failed:', err);
    return false;
  }
});

ipcMain.handle('save-auto-backup-workbook', async (_event, { data, filename }) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    const filePath = saveBinaryBackupFile(backupDir, filename, data);
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Automatic workbook backup failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rotate-auto-backup-pairs', async (_event, retentionLimit) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    return { success: true, removedPairs: rotateVerifiedBackupPairs(backupDir, retentionLimit) };
  } catch (error) {
    console.error('Paired backup retention failed:', error);
    return { success: false, error: error.message };
  }
});

// The renderer can only protect/recover a 32-byte DEK.  It cannot invoke
// arbitrary safeStorage encryption/decryption or choose filesystem paths.
ipcMain.handle('db:recovery-protector-available', () => {
  const { safeStorage } = require('electron');
  return safeStorage.isEncryptionAvailable();
});

ipcMain.handle('db:protect-recovery-dek', async (_event, rawDek) => {
  const { safeStorage } = require('electron');
  if (!safeStorage.isEncryptionAvailable() || !isValidRawDek(rawDek)) return false;
  try {
    fs.writeFileSync(path.join(app.getPath('userData'), RECOVERY_DEK_FILE), safeStorage.encryptString(rawDek));
    return true;
  } catch (err) {
    log.error('db:protect-recovery-dek failed:', err);
    return false;
  }
});

ipcMain.handle('db:recover-protected-dek', async () => {
  const { safeStorage } = require('electron');
  if (!safeStorage.isEncryptionAvailable()) return null;
  try {
    const filePath = path.join(app.getPath('userData'), RECOVERY_DEK_FILE);
    if (!fs.existsSync(filePath)) return null;
    const rawDek = safeStorage.decryptString(fs.readFileSync(filePath));
    return isValidRawDek(rawDek) ? rawDek : 'DECRYPTION_FAILED';
  } catch (err) {
    log.error('db:recover-protected-dek failed:', err);
    return 'DECRYPTION_FAILED';
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
  // A download alone never authorizes installation or an app shutdown.
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('checking-for-update', () => {
    downloadedUpdateReady = false;
    readyInstallBackupFilename = null;
    readyInstallBackupSavedAt = 0;
    sendStatusToWindow({ type: 'checking-for-update' });
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow({ type: 'update-available', info });
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow({ type: 'update-not-available', info });
  });

  autoUpdater.on('error', (err) => {
    downloadedUpdateReady = false;
    readyInstallBackupFilename = null;
    readyInstallBackupSavedAt = 0;
    console.error('Auto-updater error:', err);
    sendStatusToWindow({ type: 'update-error', message: err.message || String(err) });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const speedMB = (progressObj.bytesPerSecond / (1024 * 1024)).toFixed(2);
    const percent = Math.round(progressObj.percent);
    const transferredMB = (progressObj.transferred / (1024 * 1024)).toFixed(1);
    const totalMB = (progressObj.total / (1024 * 1024)).toFixed(1);

    sendStatusToWindow({
      type: 'download-progress',
      percent,
      speedMB,
      transferredMB,
      totalMB,
      bytesPerSecond: progressObj.bytesPerSecond
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    downloadedUpdateReady = true;
    downloadedAt = Date.now();
    readyInstallBackupFilename = null;
    readyInstallBackupSavedAt = 0;
    sendStatusToWindow({ type: 'update-downloaded', info });
  });

  ipcMain.on('check-for-updates', () => {
    void checkForUpdatesSafely();
  });

  ipcMain.handle('download-update', async () => {
    if (autoUpdater) {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (err) {
        console.error('[AutoUpdater] downloadUpdate failed:', err);
        if (process.platform === 'darwin') {
          return {
            success: false,
            isMac: true,
            error: 'macOS requires downloading the updated .dmg installer directly. Click "Download macOS Update (.dmg)" below to update.'
          };
        }
        return { success: false, error: err.message || String(err) };
      }
    }
    return { success: false, error: 'Auto-updater not available' };
  });

  ipcMain.handle('quit-and-install', async (_event, safetyBackupFilename) => {
    if (!downloadedUpdateReady) {
      return { success: false, error: 'No downloaded update is ready to install.' };
    }
    if (!isInstallBackupReady(downloadedUpdateReady, safetyBackupFilename, readyInstallBackupFilename,
      downloadedAt, readyInstallBackupSavedAt)) {
      return { success: false, error: 'A fresh verified pre-install backup is required.' };
    }
    try {
      const backupDir = path.join(app.getPath('userData'), 'backups');
      if (!verifyStrongComprehensiveBackup(readBackupFile(backupDir, safetyBackupFilename))) {
        return { success: false, error: 'The pre-install backup failed integrity verification.' };
      }
    } catch (error) {
      return { success: false, error: `The pre-install backup cannot be opened: ${error.message}` };
    }
    if (autoUpdater) {
      downloadedUpdateReady = false;
      readyInstallBackupFilename = null;
      readyInstallBackupSavedAt = 0;
      isQuitting = true;
      try {
        const srv = global.expressServer || expressServer;
        if (srv && srv.server && typeof srv.server.close === 'function') {
          srv.server.close();
        } else if (srv && typeof srv.close === 'function') {
          srv.close();
        }
      } catch (err) {
        console.warn('[AutoUpdater] Error closing Express server:', err);
      }

      // Cleanly destroy all open windows so file handles are released for NSIS
      try {
        BrowserWindow.getAllWindows().forEach((w) => {
          try {
            w.destroy();
          } catch {
            // ignore
          }
        });
      } catch (err) {
        console.warn('[AutoUpdater] Error destroying windows:', err);
      }

      setImmediate(() => {
        try {
          autoUpdater.quitAndInstall(true, true);
        } catch (err) {
          console.error('[AutoUpdater] quitAndInstall failed:', err);
          app.quit();
        }
      });
      return { success: true };
    }
    return { success: false, error: 'Auto-updater is not available.' };
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
  const status = licenseManager.getStatus();
  if (!status.activated) {
    return { success: false, error: 'Product Activation Required. Please activate FormEase Pro to use this feature.' };
  }

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
        marginType: 'printableArea'
      },
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false
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

// --- Pre-Update Validation & Reconciliation IPC ---
const PRE_UPDATE_STATE_FILE = 'formease-pre-update-state.json';

ipcMain.handle('db:verify-disk-space', async () => {
  try {
    if (fs.statfsSync) {
      const stats = fs.statfsSync(app.getPath('userData'));
      const freeBytes = stats.bfree * stats.bsize;
      return { success: true, freeBytes };
    }
    return { success: true, freeBytes: 10 * 1024 * 1024 * 1024 }; // Fallback 10GB
  } catch (err) {
    console.error('Disk space verification failed:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db:write-pre-update-state', async (event, stateData) => {
  try {
    const filePath = path.join(app.getPath('userData'), PRE_UPDATE_STATE_FILE);
    fs.writeFileSync(filePath, JSON.stringify(stateData, null, 2));
    return { success: true };
  } catch (err) {
    console.error('Failed to write pre-update state:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db:read-pre-update-state', async () => {
  try {
    const filePath = path.join(app.getPath('userData'), PRE_UPDATE_STATE_FILE);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Failed to read pre-update state:', err);
    return null;
  }
});

ipcMain.handle('db:clear-pre-update-state', async () => {
  try {
    const filePath = path.join(app.getPath('userData'), PRE_UPDATE_STATE_FILE);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to clear pre-update state:', err);
    return { success: false, error: err.message };
  }
});

// --- Recovery Center Filesystem Backups IPC ---
ipcMain.handle('list-fs-backups', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    if (!fs.existsSync(backupDir)) return [];
    
    const files = fs.readdirSync(backupDir)
      .filter(f => {
        try {
          const filePath = backupPath(backupDir, f);
          const stats = fs.lstatSync(filePath);
          return stats.isFile() && !stats.isSymbolicLink();
        } catch {
          return false;
        }
      })
      .map(f => {
        const filePath = backupPath(backupDir, f);
        const stats = fs.statSync(filePath);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content);
          return {
            filename: f,
            path: filePath,
            size: stats.size,
            mtime: stats.mtime.getTime(),
            metadata: data.metadata || {},
            summary: data.summary || {
              activeSchoolYear: data.data?.activeSchoolYear || 'Unknown',
              students: data.data?.students?.length || 0,
              sections: data.data?.sections?.length || 0,
              subjects: data.data?.subjects?.length || 0,
              grades: data.data?.classRecords?.length || 0,
            }
          };
        } catch (e) {
          return {
            filename: f,
            path: filePath,
            size: stats.size,
            mtime: stats.mtime.getTime(),
            metadata: { note: 'Raw JSON or invalid metadata' },
            summary: { activeSchoolYear: 'Unknown', students: 0, sections: 0, subjects: 0, grades: 0 }
          };
        }
      })
      .sort((a, b) => b.mtime - a.mtime);
    return files;
  } catch (error) {
    console.error('Failed to list filesystem backups:', error);
    return [];
  }
});

ipcMain.handle('read-fs-backup-content', async (event, filename) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    return readBackupFile(backupDir, filename);
  } catch (error) {
    console.error('Failed to read backup content:', error);
    throw error;
  }
});

ipcMain.handle('delete-fs-backup', async (event, filename) => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    deleteBackupFile(backupDir, filename);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return { success: false, error: error.message };
  }
});

// --- Google Drive Loopback & REST API Native handlers ---

const http = require('http');
const crypto = require('crypto');
const { shell } = require('electron');

const getGdriveAuthPath = () => path.join(app.getPath('userData'), 'gdrive_auth.json');

const storeGdriveTokens = ({ refreshToken, accessToken, expiresIn, clientId, clientSecret, email }) => {
  const authPath = getGdriveAuthPath();
  const currentAuth = getGdriveAuth() || {};
  
  const finalRefreshToken = refreshToken || currentAuth.refresh_token || null;
  const finalAccessToken = accessToken || currentAuth.access_token || null;
  const expiresAt = expiresIn ? Date.now() + (expiresIn - 60) * 1000 : (currentAuth.expires_at || null);
  const finalEmail = email || currentAuth.email || null;

  fs.writeFileSync(authPath, JSON.stringify({
    refresh_token: finalRefreshToken,
    access_token: finalAccessToken,
    expires_at: expiresAt,
    client_id: clientId || currentAuth.client_id,
    client_secret: clientSecret || currentAuth.client_secret,
    email: finalEmail
  }, null, 2), 'utf-8');
};

const storeGdriveRefreshToken = (refreshToken, clientId, clientSecret, email) => {
  storeGdriveTokens({ refreshToken, clientId, clientSecret, email });
};

const getGdriveAuth = () => {
  const authPath = getGdriveAuthPath();
  if (!fs.existsSync(authPath)) return null;
  try {
    const content = fs.readFileSync(authPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
};

const generatePKCE = () => {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
};

const exchangeCodeForTokens = async (code, verifier, redirectUri, clientId, clientSecret) => {
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }
  params.append('code', code);
  params.append('code_verifier', verifier);
  params.append('grant_type', 'authorization_code');
  params.append('redirect_uri', redirectUri);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }
  return data;
};

const fetchUserEmail = async (accessToken) => {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email || null;
  } catch (e) {
    console.error('[GDrive] Failed to fetch user email:', e);
    return null;
  }
};

const refreshAccessToken = async (refreshToken, clientId, clientSecret) => {
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }
  params.append('refresh_token', refreshToken);
  params.append('grant_type', 'refresh_token');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Token refresh failed');
  }
  return data;
};

const getGoogleAccessToken = async () => {
  const auth = getGdriveAuth();
  if (!auth) return null;

  // 1. If we have a cached access_token that is still valid, return it directly!
  if (auth.access_token && auth.expires_at && Date.now() < auth.expires_at) {
    return auth.access_token;
  }

  // 2. If no refresh_token stored, fall back to cached access_token
  if (!auth.refresh_token) {
    return auth.access_token || null;
  }

  try {
    const data = await refreshAccessToken(auth.refresh_token, auth.client_id, auth.client_secret);
    
    let email = auth.email;
    if (data.access_token && !email) {
      email = await fetchUserEmail(data.access_token);
    }

    storeGdriveTokens({
      refreshToken: data.refresh_token || auth.refresh_token,
      accessToken: data.access_token,
      expiresIn: data.expires_in || 3600,
      clientId: auth.client_id,
      clientSecret: auth.client_secret,
      email: email
    });

    return data.access_token;
  } catch (e) {
    console.error('[GDrive] Failed to refresh access token:', e);
    // Only unlink if Google returned explicit invalid_grant / revoked token
    if (e.message && (e.message.includes('invalid_grant') || e.message.includes('unauthorized_client'))) {
      const authPath = getGdriveAuthPath();
      if (fs.existsSync(authPath)) {
        try { fs.unlinkSync(authPath); } catch {}
      }
    }
    return auth.access_token || null;
  }
};

const findFolderId = async (token, folderName) => {
  const q = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to search Google Drive folders (${res.status})`);
  }
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
};

const createFolder = async (token, folderName) => {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to create folder on Google Drive (${res.status})`);
  }
  const data = await res.json();
  return data.id;
};

const uploadFileToFolder = async (token, parentFolderId, filename, content) => {
  const metadata = {
    name: filename,
    parents: [parentFolderId]
  };
  
  const boundary = 'foo_bar_boundary';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;
  
  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to upload backup JSON file to Google Drive (${res.status})`);
  }
  const data = await res.json();
  return data.id;
};

ipcMain.handle('gdrive:auth-start', async (event, { clientId, clientSecret } = {}) => {
  if (!clientId) {
    throw new Error('Google OAuth Client ID is required.');
  }

  const { verifier, challenge } = generatePKCE();
  const SCOPES = 'https://www.googleapis.com/auth/drive.file email';

  return new Promise((resolve, reject) => {
    let port = 0;
    const server = http.createServer(async (req, res) => {
      try {
        const query = new URL(req.url || '/', `http://127.0.0.1:${port}`).searchParams;
        const code = query.get('code');
        const err = query.get('error');

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <html>
              <head>
                <title>Authentication Successful</title>
                <style>
                  body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAFAFA; color: #111827; }
                  .card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 2rem; text-align: center; box-shadow: 0 4px 24px rgba(17,24,39,0.06); }
                  h2 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #4F46E5; }
                  p { margin: 0; color: #6B7280; font-size: 0.95rem; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h2>Authentication Successful!</h2>
                  <p>Google Drive has been linked to FormEase Pro.</p>
                  <p>You can close this tab and return to the application.</p>
                </div>
                <script>
                  setTimeout(() => { window.close(); }, 3000);
                </script>
              </body>
            </html>
          `);
          server.close();

          try {
            const redirectUri = `http://127.0.0.1:${port}`;
            const tokens = await exchangeCodeForTokens(code, verifier, redirectUri, clientId, clientSecret);
            
            let email = null;
            if (tokens.access_token) {
              email = await fetchUserEmail(tokens.access_token);
            }

            storeGdriveTokens({
              refreshToken: tokens.refresh_token,
              accessToken: tokens.access_token,
              expiresIn: tokens.expires_in,
              clientId: clientId,
              clientSecret: clientSecret,
              email: email
            });

            resolve({ success: true, email: email || 'school-admin@gmail.com' });
          } catch (e) {
            reject(e);
          }
        } else if (err) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<html><body><h2>Authentication failed</h2><p>${err}</p></body></html>`);
          server.close();
          reject(new Error(`OAuth error: ${err}`));
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Waiting for authentication...</h2></body></html>');
        }
      } catch (e) {
        console.error(e);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      const redirectUri = `http://127.0.0.1:${port}`;
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&code_challenge=${challenge}&code_challenge_method=S256&access_type=offline&prompt=consent`;
      shell.openExternal(authUrl);
    });

    server.on('error', reject);

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timed out. Please try again.'));
    }, 5 * 60 * 1000);
  });
});

ipcMain.handle('gdrive:status', async () => {
  const auth = getGdriveAuth();
  if (!auth || !auth.refresh_token) {
    return { connected: false, email: null };
  }
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      return { connected: false, email: null };
    }
    const freshAuth = getGdriveAuth();
    return { connected: true, email: freshAuth?.email || auth.email || 'school-admin@gmail.com' };
  } catch (_e) {
    return { connected: false, email: null };
  }
});

ipcMain.handle('gdrive:disconnect', async () => {
  const authPath = getGdriveAuthPath();
  if (fs.existsSync(authPath)) {
    fs.unlinkSync(authPath);
  }
  return { success: true };
});

const deleteGoogleDriveFile = async (token, fileId) => {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.warn('[GDrive] Failed to prune old backup file:', fileId, err);
  }
};

ipcMain.handle('gdrive:upload-backup', async (event, { backupJsonStr, filename }) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) throw new Error('Google Drive authorization has expired or is invalid. Please click Disconnect and then Link Drive to re-authorize.');

    let folderId = await findFolderId(accessToken, 'FormEase_Backups');
    if (!folderId) {
      folderId = await createFolder(accessToken, 'FormEase_Backups');
    }

    const fileId = await uploadFileToFolder(accessToken, folderId, filename, backupJsonStr);

    // Rolling retention: Keep 10 most recent backups in FormEase_Backups
    try {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime%20desc&fields=files(id,name,createdTime)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (listRes.ok) {
        const listData = await listRes.json();
        const files = listData.files || [];
        if (files.length > 10) {
          const oldFiles = files.slice(10);
          for (const oldFile of oldFiles) {
            await deleteGoogleDriveFile(accessToken, oldFile.id);
          }
        }
      }
    } catch (pruneErr) {
      console.warn('[GDrive] Auto-pruning notice:', pruneErr);
    }

    return { success: true, fileId };
  } catch (error) {
    console.error('[GDrive] Upload failed:', error);
    throw error;
  }
});

ipcMain.handle('gdrive:list-backups', async () => {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) throw new Error('Not connected to Google Drive.');

    const folderId = await findFolderId(accessToken, 'FormEase_Backups');
    if (!folderId) return [];

    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=createdTime%20desc&fields=files(id,name,size,createdTime)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to list backups from Google Drive (${res.status})`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('[GDrive] list-backups failed:', error);
    throw error;
  }
});

ipcMain.handle('gdrive:download-backup', async (event, fileId) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) throw new Error('Not connected to Google Drive.');

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to download file from Google Drive (${res.status})`);
    }
    return await res.text();
  } catch (error) {
    console.error('[GDrive] download-backup failed:', error);
    throw error;
  }
});


const os = require('os');

async function saveHtmlAsPdf(payload) {
  const tmpFile = path.join(os.tmpdir(), `html-export-${Date.now()}.html`);
  let pdfWin = null;

  const windowSizes = {
    letter: { width: 1056, height: 816 },
    a4: { width: 1123, height: 794 },
    folio: { width: 1248, height: 816 },
  };
  const size = windowSizes[payload.paperSize] || windowSizes.letter;
  const winW = payload.pageWidthPx || size.width;
  const winH = payload.pageHeightPx || size.height;
  const { dialog } = require('electron');
  const dialogParent = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

  try {
    if (!payload.html || !payload.html.trim()) {
      throw new Error('PDF export HTML is empty');
    }

    fs.writeFileSync(tmpFile, payload.html, 'utf8');

    pdfWin = new BrowserWindow({
      show: false,
      width: winW,
      height: winH,
      useContentSize: true,
      webPreferences: {
        offscreen: false,
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    pdfWin.webContents.setZoomFactor(1);
    await pdfWin.loadFile(tmpFile);
    await pdfWin.webContents.executeJavaScript(`
      Promise.all([
        document.fonts.ready,
        ...Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              })
        ),
      ])
    `);

    if (payload.postLoadScript) {
      await pdfWin.webContents.executeJavaScript(payload.postLoadScript);
    }

    const printOptions = {
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: 'none' },
    };
    if (payload.landscape !== undefined) {
      printOptions.landscape = payload.landscape;
    }
    const pdfBuffer = await pdfWin.webContents.printToPDF(printOptions);

    const defaultName = payload.defaultFilename.endsWith('.pdf')
      ? payload.defaultFilename
      : `${payload.defaultFilename}.pdf`;

    const saveDialogOptions = {
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const { filePath, canceled } = dialogParent
      ? await dialog.showSaveDialog(dialogParent, saveDialogOptions)
      : await dialog.showSaveDialog(saveDialogOptions);

    if (canceled || !filePath) {
      return { success: false, cancelled: true };
    }

    fs.writeFileSync(filePath, pdfBuffer);
    return { success: true, filePath };
  } finally {
    if (pdfWin && !pdfWin.isDestroyed()) {
      pdfWin.destroy();
    }
    try {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    } catch (e) {
      /* temp file may already be gone */
    }
  }
}

ipcMain.handle('app:export-html-pdf', async (event, payload) => {
  try {
    return await saveHtmlAsPdf(payload);
  } catch (err) {
    console.error('[IPC] exportHtmlPdf error:', err);
    throw new Error(err.message || 'Failed to export PDF');
  }
});

ipcMain.handle('push-attendance-session', async (event, sessionData) => {
  try {
    const srv = global.expressServer || expressServer;
    if (srv && srv.updateActiveSession) {
      const success = srv.updateActiveSession(sessionData);
      return success ? { success: true } : { success: false, error: 'Invalid attendance session' };
    }
    return { success: false, error: 'Express server not available' };
  } catch (err) {
    console.warn('[IPC] push-attendance-session warning:', err.message || err);
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle('start-attendance-pairing', async () => {
  try {
    const srv = global.expressServer || expressServer;
    if (srv && srv.startAttendancePairing) return srv.startAttendancePairing();
    throw new Error('Mobile Attendance Gateway is not available');
  } catch (err) {
    return { token: '', expiresAt: 0, error: err.message || String(err) };
  }
});

ipcMain.handle('revoke-attendance-pairing', async (_event, token) => {
  try {
    const srv = global.expressServer || expressServer;
    return { success: Boolean(srv && srv.revokeAttendancePairing && srv.revokeAttendancePairing(token)) };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

// --- Real-Time Attendance Sync IPC (Phone ↔ Desktop) ---
// These handlers provide a direct, zero-latency sync path through the main process,
// bypassing HTTP entirely. Critical for the production EXE where the renderer loads
// from file:// protocol and relative fetch URLs don't reach the Express server.

ipcMain.handle('push-attendance-update', async (_event, syncEvent) => {
  try {
    const srv = global.expressServer || expressServer;
    if (srv && srv.pushSyncEvent) {
      const success = srv.pushSyncEvent(syncEvent);
      return success ? { success: true } : { success: false, error: 'Invalid attendance update' };
    }
    return { success: false, error: 'Express server not available' };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle('get-attendance-updates', async (_event, sinceTimestamp) => {
  try {
    const srv = global.expressServer || expressServer;
    if (srv && srv.getSyncEventsSince) {
      return srv.getSyncEventsSince(sinceTimestamp);
    }
    return { events: [], lastUpdated: 0 };
  } catch (err) {
    console.warn('[IPC] get-attendance-updates error:', err.message || err);
    return { events: [], lastUpdated: 0 };
  }
});


ipcMain.handle('send-sms-http-request', async (event, { url, method, headers, body }) => {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const httpModule = urlObj.protocol === 'https:' ? require('https') : require('http');
      const payloadData = typeof body === 'string' ? body : JSON.stringify(body);
      const reqHeaders = Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadData)
      }, headers || {});

      const req = httpModule.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method || 'POST',
        headers: reqHeaders,
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            data
          });
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('Connection timed out after 5 seconds'));
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      req.write(payloadData);
      req.end();
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});


