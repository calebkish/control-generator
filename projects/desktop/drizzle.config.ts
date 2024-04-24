import type { Config } from 'drizzle-kit';

export default {
  schema: './src/http-server/db/schema.ts',
  driver: 'libsql',
  verbose: true,
  strict: true,
  out: './drizzle',
} satisfies Config;
