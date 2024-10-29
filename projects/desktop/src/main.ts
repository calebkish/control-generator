import path from 'node:path';
import net from 'node:net';
// `electron/main` has type definitions for things that are safe to import into the main process.
import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron/main';
import electronUpdater from 'electron-updater';

//#region electronUpdater.autoUpdater defaults
// autoDownload: true,
// autoInstallOnAppQuit: true,
// autoRunAppAfterInstall: true,
// allowPrerelease: false,
// fullChangelog: false,
// allowDowngrade: false,
// disableWebInstaller: false,
// disableDifferentialDownload: false,
// forceDevUpdateConfig: false,
//#endregion

const isDevelopment = process.env['NODE_ENV'] === 'development';

app.whenReady().then(async () => {
  console.log('App path:', app.getAppPath());
  console.log('User data data:', app.getPath('userData'));

  const apiPort = isDevelopment ? 3000 : await getPortFree();

  // Should be done before window is created so that handlers are ready.
  setupIpcHandlersAndListeners(apiPort);

  if (isDevelopment) {
    console.log('In development mode. Please start the http server manually');
  } else {
    // Can only be forked when the app is ready.
    forkHttpServer(apiPort);
  }

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


async function forkHttpServer(apiPort: number) {
  const httpServerPath = path.join(app.getAppPath(), 'tsc-out', 'http-server', 'index.js');
  const child = utilityProcess.fork(
    httpServerPath,
    [app.getPath('userData'), apiPort.toString(), app.getAppPath()],
    { stdio: 'pipe' }
  );
  if (child.stdout) {
    child.stdout.on('data', (data: Buffer) => {
      console.log('CHILD\t| ', data.toString());
    });
  }
  if (child.stderr) {
    child.stderr.on('data', (data: Buffer) => {
      console.error('CHILD\t| ', data.toString());
    });
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src', 'preload.js'),
    },
    show: false,
  });

  electronUpdater.autoUpdater.on('error', (error) => {
    console.log('[ELECTRON UPDATER]', error.name, error.message, error.stack);
    mainWindow.webContents.send('electron-updater-error', error.name, error.message, error.stack);
  });
  electronUpdater.autoUpdater.on('checking-for-update', () => {
    console.log('[ELECTRON UPDATER]', 'checking for update');
    mainWindow.webContents.send('electron-updater-checking-for-update');
  });
  electronUpdater.autoUpdater.on('update-available', (info) => {
    console.log('[ELECTRON UPDATER]', 'update available');
    mainWindow.webContents.send('electron-updater-update-available');
  });
  electronUpdater.autoUpdater.on('update-not-available', (info) => {
    console.log('[ELECTRON UPDATER]', 'update not available');
    mainWindow.webContents.send('electron-updater-update-not-availabe');
  });
  electronUpdater.autoUpdater.on('update-downloaded', (downloadEvent) => {
    console.log('[ELECTRON UPDATER]', 'update-downloaded');
    mainWindow.webContents.send('electron-updater-update-downloaded');
  });
  electronUpdater.autoUpdater.on('download-progress', (progress) => {
    console.log('[ELECTRON UPDATER]', `download progress ${progress.percent}`);
    mainWindow.webContents.send('electron-updater-download-progress', progress.percent);
  });

  electronUpdater.autoUpdater.on('update-cancelled', (info) => {
    console.log('[ELECTRON UPDATER]', 'update canceled');
    mainWindow.webContents.send('electron-updater-update-cancelled');
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  if (isDevelopment) {
    console.log('In development mode. Please start angular dev server manually');
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadFile('tsc-out/browser/index.html');
  }
}

function setupIpcHandlersAndListeners(apiPort: number) {
  ipcMain.handle('get-api-port', async () => {
    return apiPort;
  });

  ipcMain.handle('quit-and-install', async () => {
    console.log('[ELECTRON UPDATER]', 'Invoking quit-and-install');
    electronUpdater.autoUpdater.quitAndInstall();

    // just return something so that electron doesn't complain
    return null;
  });

  ipcMain.handle('check-for-updates', async () => {
    console.log('[ELECTRON UPDATER]', 'Invoking check-for-updates');
    // If update is available, download will automatically start (electronUpdater.autoUpdater.autoDownload).
    await electronUpdater.autoUpdater.checkForUpdates();

    // just return something so that electron doesn't complain
    return null;
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
