import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  // driver: 'better-sqlite',
  driver: 'libsql',
  verbose: true,
  strict: true,
  out: './drizzle',
} satisfies Config;
