const dotenv = require('dotenv');

const readDotenv = process.env['READ_DOTENV'];

if (readDotenv) {
  dotenv.config();
}

const ghToken = process.env['GH_TOKEN'];

const config = {
  appId: 'com.something-cool.electron',
  productName: 'something-cool',
  files: [
    "src/**/*"
  ],
  publish: [
    {
      provider: 'github',
      owner: 'calebkish',
      repo: 'my-electron-app',
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
