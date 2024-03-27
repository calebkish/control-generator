const dotenv = require('dotenv');

const ci = process.env['CI'];

if (!ci) {
  dotenv.config();
}

const ghToken = process.env['GH_TOKEN'];

if (!ghToken) {
  throw new Error('Error: GH_TOKEN is not defined');
}

const config = {
  appId: "com.something-cool.electron",
  productName: "something-cool",
  publish: [
    {
      provider: "github",
      owner: "calebkish",
      repo: "my-electron-app",
      private: false,
      releaseType: 'release',
      ...(ghToken ? { token: ghToken } : {}),
    },
  ],
  win: {
    target: [
      "nsis",
    ],
  },
  linux: {
    target: [
      "AppImage",
    ],
  },
};

module.exports = config;
