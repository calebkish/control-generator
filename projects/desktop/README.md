# my-electron-app

- `cross-env` to set environment variables across OS's
  - `cross-env NODE_ENV=development electron .`

https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf

- on main.js change, restart the desktop app.
- on renderer change, refresh the browser in the app.

- `app.getAppPath()`
  - When built: `/home/caleb/electron/my-electron-app/projects/desktop/dist/linux-unpacked/resources/app.asar`
  - When running `electron .`: `/home/caleb/electron/my-electron-app/projects/desktop`
  - published:

- extract .asar: `npx @electron/asar extract app.asar <destfolder>`
