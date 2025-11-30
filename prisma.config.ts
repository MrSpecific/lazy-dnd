import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // schema: 'prisma/schema.prisma',
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
  experimental: {
    externalTables: true,
  },
  tables: {
    external: ['neon_auth.users_sync'],
  },
});
