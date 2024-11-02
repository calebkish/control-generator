import fs from 'node:fs';

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.promises.stat(path);
    return true;
  } catch  {
    return false;
  }
}

