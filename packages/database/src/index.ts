import { PrismaClient } from '../generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ==========================================
// Prisma Client Singleton with Connection Pooling
// ==========================================
// Uses NEW "prisma-client" generator (TypeScript + WebAssembly)
// Benefits:
// - Faster query execution (no Rust serialization overhead)
// - Better ESM compatibility
// - Works with Cloudflare Workers, Deno, Bun
// - Direct TypeScript code generation
// ==========================================

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:123@localhost:5434/mimicare?schema=public';

// Create connection pool
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not available
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Prisma Client factory function
const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Global type declaration for singleton
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use global singleton in development to prevent multiple instances during HMR
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

// Export singleton instance
export { prisma };

// Export PrismaClient class for type definitions and DI
export { PrismaClient } from '../generated/client/client';

// Export all generated types
export * from '../generated/client/client';
