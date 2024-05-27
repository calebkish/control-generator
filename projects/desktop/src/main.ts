import path from 'node:path';
import net from 'node:net';
// `electron/main` has type definitions for things that are safe to import into the main process.
import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron/main';
import electronUpdater from 'electron-updater';
// import { LlamaCpp } from "@langchain/community/llms/llama_cpp";

const isDevelopment = process.env['NODE_ENV'] === 'development';

app.whenReady().then(() => {
  console.log('App path:', app.getAppPath());
  console.log('User data data:', app.getPath('userData'));

  if (isDevelopment) {
    console.log('In development mode. Please start the http server manually');
  } else {
    // Can only be forked when the app is ready.
    forkHttpServer();
  }

  // Should be done before window is created so that handlers are ready.
  setupIpcHandlersAndListeners();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  console.log('[ELECTRON]', 'checking for update');
  ipcMain.emit('electron-updater-checking-for-update');
  // Do work after the app has started
  electronUpdater.autoUpdater.checkForUpdatesAndNotify({
    title: 'Update available',
    body: 'A new update is available!',
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


async function forkHttpServer() {
  const freePort = await getPortFree();

  const httpServerPath = path.join(app.getAppPath(), 'tsc-out', 'http-server', 'index.js');
  // const child = utilityProcess.fork(httpServerPath, [app.getPath('userData'), freePort.toString()], { stdio: 'pipe' });
  const child = utilityProcess.fork(httpServerPath, [app.getPath('userData'), '3000', app.getAppPath()], { stdio: 'pipe' });
  if (child.stdout) {
    child.stdout.on('data', (data: Buffer) => {
      console.log('CHILD\t| ', data.toString());
    });
  }
  if (child.stderr) {
    child.stderr.on('data', (data: Buffer) => {
      console.error('CHILD\t | ', data.toString());
    });
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1500,
    height: 1000,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src', 'preload.js'),
    },
    show: false,
    backgroundColor: 'rgb(245 243 255)',
  });

  window.once('ready-to-show', () => {
    window.show();
    window.focus();
  });

  if (isDevelopment) {
    console.log('In development mode. Please start angular dev server manually');
    window.loadURL('http://localhost:4200');
  } else {
    window.loadFile('tsc-out/browser/index.html');
  }
}

function setupIpcHandlersAndListeners() {
  // ipcMain.handle('check-for-updates', async () => {
  //   console.log('[ELECTRON]', 'emitting pong');
  //   const result = await electronUpdater.autoUpdater.checkForUpdatesAndNotify({
  //     title: 'Update available',
  //     body: 'A new update is available!',
  //   });
  //   const updateCheckResult = await electronUpdater.autoUpdater.checkForUpdates();
  //   electronUpdater.autoUpdater.
  //   return result;
  // });

  electronUpdater.autoUpdater.on('error', (error) => {
    console.log('[ELECTRON UPDATER]', error);
    ipcMain.emit('electron-updater-error', error);
  });

  electronUpdater.autoUpdater.on('checking-for-update', () => {
    console.log('[ELECTRON UPDATER]', 'checking for update');
    ipcMain.emit('electron-updater-checking-for-update');
  });

  electronUpdater.autoUpdater.on('update-available', (info) => {
    console.log('[ELECTRON UPDATER]', 'update available');
    ipcMain.emit('electron-updater-update-available', info);
  });

  electronUpdater.autoUpdater.on('update-not-available', (info) => {
    console.log('[ELECTRON UPDATER]', 'update not available');
    ipcMain.emit('electron-updater-update-not-availabe', info);
  });

  electronUpdater.autoUpdater.on('update-downloaded', (downloadEvent) => {
    console.log('[ELECTRON UPDATER]', 'update-downloaded');
    ipcMain.emit('electron-updater-update-downloaded', downloadEvent);
  });

  electronUpdater.autoUpdater.on('download-progress', (progress) => {
    console.log('[ELECTRON UPDATER]', `download progress ${progress.percent}`, progress);
    ipcMain.emit('electron-updater-download-progress', progress);
  });

  electronUpdater.autoUpdater.on('update-cancelled', (info) => {
    console.log('[ELECTRON UPDATER]', 'update canceled');
    ipcMain.emit('electron-updater-update-cancelled', info);
  });
}


async function getPortFree(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const addressInfo = srv.address();

      if (addressInfo === null || typeof addressInfo === 'string') {
        srv.close(() => rej());
        return;
      }

      srv.close(() => res(addressInfo.port));
    });
  });
}
