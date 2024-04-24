/*
A BrowserWindow's preload script runs in a context that has access to both
the HTML DOM and a limited subset of Node.js and Electron APIs:
- Electron modules
- Node.js modules: events, timers, url
- Polyfilled globals: Buffer, process, clearImmediate, setImmediate

Preload scripts are injected before a web page loads in the renderer, similar
to a Chrome extension's content scripts. To add features to your renderer
that require privileged access, you can define global objects through the
contextBridge API.

- The `require()` function is just a polyfill. Do not try to `require()` a CommonJS module.
  - https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
- When sandboxed, this file cannot be an ES module or import ES modules.
  - https://www.electronjs.org/docs/latest/tutorial/esm#sandboxed-preload-scripts-cant-use-esm-imports
*/

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
  invoke: (
    /** @type {string} */ channel,
    /** @type {unknown[]} */ ...args
  ) => ipcRenderer.invoke(channel, ...args),

  on: (
    /** @type {string} */ channel,
    /** @type {(...args: unknown[]) => unknown} */ handler
  ) => {

    // Deliberately strip event. `IpcRendererEvent.sender` is not something that
    // should be passed to the renderer context.
    const subscription = (
      /** @type {import('electron').IpcRendererEvent} */ event,
      /** @type {unknown[]} */ ...args
    ) => handler(...args);

    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  }
});
