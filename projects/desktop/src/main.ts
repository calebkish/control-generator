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

  // Do work after the app has started
  electronUpdater.autoUpdater.checkForUpdatesAndNotify();
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
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'src', 'preload.js'),
    },
  });

  if (isDevelopment) {
    console.log('In development mode. Please start angular dev server manually');
    win.loadURL('http://localhost:4200');
  } else {
    win.loadFile('tsc-out/browser/index.html');
  }
}

function setupIpcHandlersAndListeners() {
  // const llamaPath = path.join(app.getPath('userData'), 'mistral-7b-instruct-v0.2.Q4_K_M.gguf');
  // const model = new LlamaCpp({ modelPath: llamaPath });

  // ipcMain.handle('ping', async () => {
  //   const prompt = 'Tell me a short story about a happy Llama that 2 sentences long.';
  //   // const stream = await model.stream(prompt);
  //   // const reader = stream.getReader();
  //   // return reader;
  //   const response = await model.invoke(prompt);
  //   return response;
  // });
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
