import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';
import electronUpdater from 'electron-updater';
import { LlamaCpp } from "@langchain/community/llms/llama_cpp";
import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const hono = new Hono();

hono.get('/api', async (c) => {
  return c.text('hello world!');
});

const port = 3000;

console.log(`Server is running on port ${port}`);
serve({
  fetch: hono.fetch,
  port,
});
console.log(`Server is running on port ${port}`);


const isDevelopment = process.env['NODE_ENV'] === 'development';

console.log('CWD', process.cwd())
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(process.cwd(), 'src', 'preload.js'),
    },
  });

  // win.removeMenu();

  if (isDevelopment) {
    win.loadURL('http://localhost:4200');
  } else {
    win.loadFile('src/browser/index.html');
  }
}

const llamaPath = path.join(app.getPath('userData'), 'mistral-7b-instruct-v0.2.Q4_K_M.gguf');
const model = new LlamaCpp({ modelPath: llamaPath });

app.whenReady().then(() => {
  electronUpdater.autoUpdater.checkForUpdatesAndNotify();

  ipcMain.handle('ping', async () => {
    const prompt = "Tell me a short story about a happy Llama that 2 sentences long.";
    const stream = await model.stream(prompt);
    const reader = stream.getReader();
    return reader;
    // const response = await model.invoke(prompt);
    // return response;
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
