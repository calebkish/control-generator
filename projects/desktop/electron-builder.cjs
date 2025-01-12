const dotenv = require('dotenv');

const readDotenv = process.env['READ_DOTENV'];

if (readDotenv) {
  console.log('=== Reading .env ===');
  dotenv.config();
}

const ghToken = process.env['GH_TOKEN'];

/**
* @type {import('electron-builder').Configuration}
* @see https://www.electron.build/configuration
* @see https://github.com/electron-userland/electron-builder/blob/master/packages/app-builder-lib/src/configuration.ts
*/
const config = {
  appId: 'com.sox-ai.electron',

  // The name of the executable
  productName: 'SOX AI',

  // https://www.electron.build/configuration#artifactname
  artifactName: 'sox-ai.${ext}',

  // on build, specify the files that should be bundled into the `app.asar`
  files: [
    "tsc-out/**/*",
    "drizzle/**/*",
    "pdf-resources/**/*",

    // === Included by default (for more info: https://www.electron.build/configuration#files) ===
    // "package.json"
    // "**/node_modules/**/*"
    // "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    // "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    // "!**/node_modules/*.d.ts",
    // "!**/node_modules/.bin",
    // "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    // "!.editorconfig",
    // "!**/._*",
    // "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
    // "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
    // "!**/{appveyor.yml,.travis.yml,circle.yml}",
    // "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
  ],

  // https://www.electron.build/app-builder-lib.interface.metadatadirectories
  directories: {
    // Files that are used to build the electron app, but will not be explicitly
    // included in `app.asar`.
    buildResources: 'build',
    output: 'dist',
    app: './',
  },

  // https://www.electron.build/publish
  publish: [
    {
      provider: 'github',
      owner: 'calebkish',
      repo: 'control-generator',
      private: true,
      ...(ghToken ? { token: ghToken } : {}),
    },
  ],

  // https://www.electron.build/win
  win: {
    target: ['nsis'],
    icon: 'build/icon.ico',
  },
};

module.exports = config;
