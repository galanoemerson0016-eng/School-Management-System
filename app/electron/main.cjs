const { app, BrowserWindow, screen, Menu, ipcMain } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const { autoUpdater } = require('electron-updater');

const isDev = !app.isPackaged;
 
// Optimization for Sharp Text and High-DPI Screens
app.commandLine.appendSwitch('high-dpi-support', '1');
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
// If blurriness persists on some Windows laptops, uncomment the line below:
// app.disableHardwareAcceleration();

// SINGLE INSTANCE LOCK
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
    title: "FormEase G7 - School Management System",
    autoHideMenuBar: true
  });

  // Remove menu bar
  Menu.setApplicationMenu(null);

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

// IPC Handlers
ipcMain.handle('get-machine-id', () => {
  try {
    return machineIdSync();
  } catch (error) {
    console.error('Failed to get machine ID:', error);
    return 'UNKNOWN-DEVICE';
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
  sendStatusToWindow('Checking for updates...');
});
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow(`Update available (v${info.version}). Downloading...`);
});
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('FormEase is up to date.');
});
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error checking for updates.');
});
autoUpdater.on('download-progress', (progressObj) => {
  sendStatusToWindow(`Downloading update: ${Math.round(progressObj.percent)}%`);
});
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded. Restarting app to install...');
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 3000);
});

ipcMain.on('check-for-updates', () => {
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  } else {
    sendStatusToWindow('Auto-updates disabled in development mode.');
  }
});
