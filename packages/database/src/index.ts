// packages/database/src/index.ts
import { PrismaClient } from '../generated/client/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pgClient = new pg.Client({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pgClient);

const prismaClientSingleton = () => {
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const globalForPrisma = globalThis as unknown as {
  prisma: undefined | ReturnType<typeof prismaClientSingleton>;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma };
export * from '../generated/client/client';
