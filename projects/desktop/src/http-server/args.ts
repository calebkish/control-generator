const defaultPort = 3000;

const _userDataDir = process.argv[2];
const _port = process.argv[3];
const _appPath = process.argv[4];

if (!_userDataDir) {
  throw new Error('User data directory was not set.');
}

const parsedPort = !!_port ? parseInt(_port) : defaultPort;

if (!_appPath) {
  throw new Error('User data directory was not set.');
}

export const userDataDir = _userDataDir;
export const port = Number.isNaN(parsedPort) ? defaultPort : parsedPort;
export const appPath = _appPath;
