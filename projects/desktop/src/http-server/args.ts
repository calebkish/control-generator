const defaultPort = 3000;

const _userDataDir = process.argv[2];
const _port = process.argv[3];

if (!_userDataDir) {
  throw new Error('User data directory was not set.');
}

const parsedPort = !!_port ? parseInt(_port) : defaultPort;

export const userDataDir = _userDataDir;
export const port = Number.isNaN(parsedPort) ? defaultPort : parsedPort;
