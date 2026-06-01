const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettingsWindow: () => ipcRenderer.invoke('close-settings-window'),
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', dx, dy),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  onSettingsChanged: (callback) => {
    ipcRenderer.on('settings-changed', (event, settings) => callback(settings));
  },
  onLockPositionChanged: (callback) => {
    ipcRenderer.on('lock-position-changed', (event, locked) => callback(locked));
  }
});
