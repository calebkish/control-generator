const _userDataDir = process.argv[2];

if (!_userDataDir) {
  throw new Error('User data directory was not set.');
}

export const userDataDir = _userDataDir;
