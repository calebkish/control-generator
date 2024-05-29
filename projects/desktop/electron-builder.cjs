const dotenv = require('dotenv');

const readDotenv = process.env['READ_DOTENV'];

if (readDotenv) {
  dotenv.config();
}

const ghToken = process.env['GH_TOKEN'];

// https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/configuration.ts
const config = {
  appId: 'com.control-generator.electron',

  // The name of the executable
  productName: 'Control Generator',

  // on build, specify the files that should be bundled into the `app.asar`
  files: [
    "tsc-out/**/*",
    "drizzle/**/*",
    "src/preload.js",
  ],

  directories: {
    buildResources: 'build', // files that will not be bundled into `app.asar`
    output: 'dist',
    app: './',
  },

  publish: [
    {
      provider: 'github',
      owner: 'calebkish',
      repo: 'control-generator',
      private: true,
      ...(ghToken ? { token: ghToken } : {}),
    },
  ],
  win: {
    target: ['nsis'],
  },
  linux: {
    target: ['AppImage'],
  },
};

module.exports = config;
