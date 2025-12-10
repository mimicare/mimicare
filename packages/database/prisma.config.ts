import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma',

  // Migrations directory
  migrations: {
    path: './prisma/migrations',
  },

  // Database URL from environment
  datasource: {
    url:
      process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5434/mimicare?schema=public',
  },
});
