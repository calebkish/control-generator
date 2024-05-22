import * as schema from './schema.js';
import fs from 'node:fs';
import path from 'node:path';

// import { drizzle } from 'drizzle-orm/better-sqlite3';
// import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';

import { userDataDir } from '../args.js';

// const betterSqliteDb = new Database(path.join(userDataDir, 'control-generator.db'));
// export const db = drizzle(betterSqliteDb, { schema, logger: false });

const stats = fs.statSync(userDataDir, { throwIfNoEntry: false });
if (!stats) {
  fs.mkdirSync(userDataDir, { recursive: true });
}
const client = createClient({ url: `file:${path.join(userDataDir, 'control-generator.db')}` });
export const db = drizzle(client, { schema, logger: false });
