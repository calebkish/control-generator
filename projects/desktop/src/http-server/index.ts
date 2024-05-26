import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db/index.js';
import { apiRouter } from './routes/api.js';
import { appPath, port } from './args.js';
import path from 'node:path';

try {
  const migrationsFolder = path.join(appPath, 'drizzle');

  await migrate(db, { migrationsFolder });
  console.log('SQLite migrations complete');
} catch (error) {
  console.error('SQLite migrations failed');
  console.error(error);
  process.exit(1);
}

const app = new Hono();

app.route('/api', apiRouter);

console.log(`Server is running on port ${port}`);

serve({ fetch: app.fetch, port });
