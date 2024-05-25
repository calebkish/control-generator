import type { Config } from 'drizzle-kit';

export default {
  schema: './src/http-server/db/schema.ts',
  dialect: 'sqlite',
  driver: 'turso',
  verbose: true,
  strict: true,
  out: './drizzle',
  dbCredentials: {
    url: 'file:user-data/control-generator.db'
  }
} satisfies Config;
