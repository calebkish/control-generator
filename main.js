const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const isDevelopment = process.env['NODE_ENV'];

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // true by default
      sandbox: true, // true by default
    }
  });

  if (isDevelopment) {
    win.loadURL("http://localhost:4200");
  } else {
    win.loadFile('index.html');
  }
}

app.whenReady().then(() => {

  ipcMain.handle('ping', () => {
    return 'pong';
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
