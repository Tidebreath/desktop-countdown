const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let settingsWindow = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let settings = {};
const settingsPath = path.join(app.getPath('userData'), 'countdown-settings.json');

// Cached window geometry — width/height are NEVER read from getBounds()
// during drag because frameless windows on Windows report drifting bounds.
// Position is tracked here too to avoid any getBounds() call during moves.
let winX = 0, winY = 0;
let winW = 400, winH = 180;

const defaultSettings = {
  targetDate: '2027-01-01',
  title: '新年',
  fontSize: 26,
  accentColor: '#64B5F6',
  bgOpacity: 0.75,
  showSeconds: true,
  alwaysOnTop: true,
  lockPosition: false,
  autoStart: false,
  windowX: null,
  windowY: null,
  windowW: 400,
  windowH: 180
};

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      settings = { ...defaultSettings, ...raw };
    } else {
      settings = { ...defaultSettings };
    }
  } catch (e) {
    settings = { ...defaultSettings };
  }
}

function saveSettingsToFile(newSettings) {
  if (newSettings) {
    settings = { ...settings, ...newSettings };
  }
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

function setAutoStart(enable) {
  const opts = { openAtLogin: enable };
  // In unpackaged (dev) mode, Electron registers itself without the app path,
  // so on boot it shows the default welcome screen instead of our app.
  // Explicitly pass the app directory so the correct page loads.
  if (!app.isPackaged) {
    opts.path = process.execPath;           // electron.exe
    opts.args = [path.resolve(__dirname)];  // app directory
  }
  app.setLoginItemSettings(opts);
}

function createMainWindow() {
  loadSettings();

  // Restore saved window size (or use defaults)
  const savedW = settings.windowW || 400;
  const savedH = settings.windowH || 180;

  const winOpts = {
    width: savedW,
    height: savedH,
    minWidth: 240,
    minHeight: 100,
    maxWidth: 800,
    maxHeight: 500,
    frame: false,
    transparent: true,
    alwaysOnTop: settings.alwaysOnTop,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  };

  if (settings.windowX != null && settings.windowY != null) {
    winOpts.x = settings.windowX;
    winOpts.y = settings.windowY;
  }

  mainWindow = new BrowserWindow(winOpts);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // --- Cache initial geometry so drag never calls getBounds() ---
  {
    const b = mainWindow.getBounds();
    winX = b.x;
    winY = b.y;
    winW = b.width;
    winH = b.height;
  }

  let moveSaveTimer = null;
  mainWindow.on('moved', () => {
    if (mainWindow && !settings.lockPosition) {
      const [x, y] = mainWindow.getPosition();
      winX = x;
      winY = y;
      settings.windowX = x;
      settings.windowY = y;
      clearTimeout(moveSaveTimer);
      moveSaveTimer = setTimeout(() => saveSettingsToFile(), 300);
    }
  });

  let resizeSaveTimer = null;
  mainWindow.on('resize', () => {
    if (mainWindow) {
      // Update cached size from the actual resize event (user dragging corner)
      const [w, h] = mainWindow.getSize();
      winW = w;
      winH = h;
      settings.windowW = w;
      settings.windowH = h;
      clearTimeout(resizeSaveTimer);
      resizeSaveTimer = setTimeout(() => saveSettingsToFile(), 300);
    }
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
}

function openSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 440,
    height: 620,
    alwaysOnTop: true,
    resizable: false,
    title: '倒计时设置',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  settingsWindow.loadFile(path.join(__dirname, 'settings', 'settings.html'));
  settingsWindow.setMenuBarVisibility(false);

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-settings', () => {
  loadSettings();
  return settings;
});

ipcMain.handle('save-settings', (event, newSettings) => {
  saveSettingsToFile(newSettings);
  // Sync auto-start with the OS whenever the setting changes
  if (newSettings.autoStart !== undefined) {
    setAutoStart(newSettings.autoStart);
  }
  if (mainWindow) {
    // Apply window size if changed from settings panel
    if (newSettings.windowW !== undefined && newSettings.windowH !== undefined) {
      const w = newSettings.windowW;
      const h = newSettings.windowH;
      winW = w;
      winH = h;
      mainWindow.setBounds({ x: winX, y: winY, width: w, height: h });
    }
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop, 'screen-saver');
    mainWindow.webContents.send('settings-changed', settings);
  }
  return settings;
});

ipcMain.handle('open-settings', () => {
  openSettingsWindow();
});

ipcMain.handle('close-settings-window', () => {
  if (settingsWindow) {
    settingsWindow.close();
  }
});

ipcMain.on('show-context-menu', () => {
  if (!mainWindow) return;
  const template = [
    { label: '⚙  设置', click: () => openSettingsWindow() },
    { type: 'separator' },
    { label: '始终置顶', type: 'checkbox', checked: settings.alwaysOnTop, click: (mi) => {
      settings.alwaysOnTop = mi.checked;
      mainWindow.setAlwaysOnTop(mi.checked, 'screen-saver');
      saveSettingsToFile();
    }},
    { label: '锁定位置', type: 'checkbox', checked: settings.lockPosition, click: (mi) => {
      settings.lockPosition = mi.checked;
      saveSettingsToFile();
      mainWindow.webContents.send('lock-position-changed', mi.checked);
    }},
    { type: 'separator' },
    { label: '开机自启', type: 'checkbox', checked: settings.autoStart, click: (mi) => {
      settings.autoStart = mi.checked;
      setAutoStart(mi.checked);
      saveSettingsToFile();
    }},
    { type: 'separator' },
    { label: '显示窗口', click: () => { mainWindow.show(); mainWindow.focus(); }},
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); }}
  ];
  Menu.buildFromTemplate(template).popup({ window: mainWindow });
});

ipcMain.on('move-window', (event, dx, dy) => {
  if (mainWindow && !settings.lockPosition) {
    // Read position via getPosition() (x/y only, no size).
    // Use the cached winW/winH — NEVER call getBounds() during drag
    // because frameless windows on Windows report drifting bounds
    // on every call, causing the window to grow infinitely.
    const [x, y] = mainWindow.getPosition();
    winX = x + dx;
    winY = y + dy;
    mainWindow.setBounds({
      x: winX,
      y: winY,
      width: winW,
      height: winH
    });
  }
});

app.whenReady().then(() => {
  createMainWindow();
  if (settings.autoStart) {
    setAutoStart(true);
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
});
