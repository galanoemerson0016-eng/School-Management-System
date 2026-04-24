const { app, BrowserWindow, screen, Menu } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
 
// Optimization for Sharp Text and High-DPI Screens
app.commandLine.appendSwitch('high-dpi-support', '1');
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

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
}

