import { PrismaClient } from '@prisma/client';

// Singleton Prisma client — reused across requests
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
