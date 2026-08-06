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
      fullscreen: false,
      icon: process.platform === 'win32'
        ? path.join(__dirname, '..', isDev ? 'public' : 'dist', 'icon.ico')
        : path.join(__dirname, '..', isDev ? 'public' : 'dist', 'app-logo.png'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
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

global.expressServer = null;

  app.whenReady().then(() => {
    if (process.platform === 'win32') {
      app.setAppUserModelId('com.formease.pro');
    }
    createWindow();

    // Start local Express server for Mobile Attendance Gateway
    try {
      const serverPath = path.join(__dirname, '..', 'server.js');
      if (fs.existsSync(serverPath)) {
        const { exec } = require('child_process');
        
        // Force kill any process using Port 3001 (e.g., leftover dev server) to prevent conflicts
        exec('for /f "tokens=5" %a in (\'netstat -aon ^| find "LISTENING" ^| find ":3001"\') do taskkill /f /pid %a', () => {
          try {
            global.expressServer = require(serverPath);
            if (log && log.info) log.info('[FormEase Pro] Mobile Gateway server started on port 3001');

            // Add error listener to check for port conflicts
            if (global.expressServer.server) {
              global.expressServer.server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                   const { dialog } = require('electron');
                   dialog.showErrorBox(
                     'Network Port Conflict',
                     'FormEase Pro could not start the Mobile Attendance Gateway because Port 3001 is already in use.\n\nThis usually happens if you are running the Development Server at the same time as the EXE app.\n\nPlease completely close all background node.exe processes and restart FormEase Pro for mobile sync to work.'
                   );
                }
              });
            }
          } catch (reqErr) {
            console.warn('[FormEase Pro] Express server startup notice:', reqErr.message || reqErr);
          }
        });
      }
    } catch (err) {
      console.warn('[FormEase Pro] Express server init error:', err.message || err);
    }

    // Check for updates after the app is ready (only in production)
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify();
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

// --- DB salt via safeStorage (OS-level encrypted keychain) ---
// The DB salt is 32 bytes of randomness persisted across app restarts.
// Keeping it in safeStorage prevents it from being extracted by a script
// that can read localStorage (e.g., a compromised renderer).
const SALT_FILE = 'formease-db-salt.enc';

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
    sendStatusToWindow({ type: 'checking-for-update' });
  });

  autoUpdater.on('update-available', (info) => {
    sendStatusToWindow({ type: 'update-available', info });
  });

  autoUpdater.on('update-not-available', (info) => {
    sendStatusToWindow({ type: 'update-not-available', info });
  });

  autoUpdater.on('error', (err) => {
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
    sendStatusToWindow({ type: 'update-downloaded', info });
  });

  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  ipcMain.handle('download-update', () => {
    if (autoUpdater) {
      autoUpdater.downloadUpdate();
      return { success: true };
    }
    return { success: false, error: 'Auto-updater not available' };
  });

  ipcMain.on('quit-and-install', () => {
    if (autoUpdater) {
      isQuitting = true;
      if (global.expressServer && typeof global.expressServer.close === 'function') {
        try {
          global.expressServer.close();
        } catch {
          // ignore
        }
      }
      // Cleanly destroy all open windows so file handles are released for NSIS
      BrowserWindow.getAllWindows().forEach((w) => {
        try {
          w.destroy();
        } catch {
          // ignore
        }
      });
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true);
      });
    }
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
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const filePath = path.join(backupDir, f);
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
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'backups', filename);
    if (!fs.existsSync(filePath)) throw new Error('Backup file not found');
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to read backup content:', error);
    throw error;
  }
});

ipcMain.handle('delete-fs-backup', async (event, filename) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, 'backups', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
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

const storeGdriveRefreshToken = (refreshToken, clientId, clientSecret, email) => {
  const authPath = getGdriveAuthPath();
  const currentAuth = getGdriveAuth() || {};
  fs.writeFileSync(authPath, JSON.stringify({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    email: email || currentAuth.email || null
  }, null, 2), 'utf-8');
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

  const res = await fetch('https://www.googleapis.com/token', {
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
  if (!auth || !auth.refresh_token || !auth.client_id) return null;
  try {
    const data = await refreshAccessToken(auth.refresh_token, auth.client_id, auth.client_secret);
    
    // If the access token was refreshed and we don't have the email cached, fetch and save it!
    if (data.access_token && !auth.email) {
      const email = await fetchUserEmail(data.access_token);
      if (email) {
        storeGdriveRefreshToken(auth.refresh_token, auth.client_id, auth.client_secret, email);
      }
    }

    return data.access_token;
  } catch (e) {
    console.error('[GDrive] Failed to refresh access token:', e);
    if (e.message && e.message.includes('invalid_grant')) {
      const authPath = getGdriveAuthPath();
      if (fs.existsSync(authPath)) {
        fs.unlinkSync(authPath);
      }
    }
    return null;
  }
};

const findFolderId = async (token, folderName) => {
  const q = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to search Google Drive folders.');
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
  if (!res.ok) throw new Error('Failed to create folder on Google Drive.');
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

  if (!res.ok) throw new Error('Failed to upload backup JSON file to Google Drive.');
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

            const tokenToStore = tokens.refresh_token || tokens.access_token || '';
            storeGdriveRefreshToken(tokenToStore, clientId, clientSecret, email);

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
  return { connected: true, email: auth.email || 'school-admin@gmail.com' };
});

ipcMain.handle('gdrive:disconnect', async () => {
  const authPath = getGdriveAuthPath();
  if (fs.existsSync(authPath)) {
    fs.unlinkSync(authPath);
  }
  return { success: true };
});

ipcMain.handle('gdrive:upload-backup', async (event, { backupJsonStr, filename }) => {
  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) throw new Error('Not connected to Google Drive.');

    let folderId = await findFolderId(accessToken, 'FormEase_Backups');
    if (!folderId) {
      folderId = await createFolder(accessToken, 'FormEase_Backups');
    }

    const fileId = await uploadFileToFolder(accessToken, folderId, filename, backupJsonStr);
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
    if (!res.ok) throw new Error('Failed to list backups from Google Drive.');
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
    if (!res.ok) throw new Error('Failed to download file from Google Drive.');
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
    if (global.expressServer && global.expressServer.updateActiveSession) {
      global.expressServer.updateActiveSession(sessionData);
    }
  } catch (err) {
    console.warn('[IPC] In-memory session update warning:', err.message || err);
  }

  return new Promise((resolve) => {
    try {
      const http = require('http');
      const payload = JSON.stringify(sessionData || {});
      const req = http.request({
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/attendance/session',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 3000
      }, (res) => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300 });
      });
      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.write(payload);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
});

// --- Real-Time Attendance Sync IPC (Phone ↔ Desktop) ---
// These handlers provide a direct, zero-latency sync path through the main process,
// bypassing HTTP entirely. Critical for the production EXE where the renderer loads
// from file:// protocol and relative fetch URLs don't reach the Express server.

ipcMain.handle('push-attendance-update', async (_event, syncEvent) => {
  try {
    if (global.expressServer && global.expressServer.pushSyncEvent) {
      global.expressServer.pushSyncEvent(syncEvent);
      return { success: true };
    }
    return { success: false, error: 'Express server not available' };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
});

ipcMain.handle('get-attendance-updates', async (_event, sinceTimestamp) => {
  try {
    if (global.expressServer && global.expressServer.getSyncEventsSince) {
      return global.expressServer.getSyncEventsSince(sinceTimestamp);
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


