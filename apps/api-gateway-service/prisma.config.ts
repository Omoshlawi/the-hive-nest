import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
import path from 'node:path';

export default defineConfig({
  // Path to your declarative model definitions
  schema: path.join('prisma', 'schema.prisma'),

  // Database connection (ignores any URL set inside schema.prisma)
  datasource: {
    url: env('DATABASE_URL'),
  },

  // (Optional) Explicit paths for migrations
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
});
