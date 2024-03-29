// A BrowserWindow's preload script runs in a context that has access to both
// the HTML DOM and a limited subset of Node.js and Electron APIs:
// - Electron modules
// - Node.js modules: events, timers, url
// - Polyfilled globals: Buffer, process, clearImmediate, setImmediate

// Preload scripts are injected before a web page loads in the renderer, similar
// to a Chrome extension's content scripts. To add features to your renderer
// that require privileged access, you can define global objects through the
// contextBridge API.

// TLDR: Add privledged features to the renderer context.

// The `require()` function is just a polyfill.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, handler) => {
    // Deliberately strip event as it includes `sender`
    const subscription = (event, ...args) => handler(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  }
});
