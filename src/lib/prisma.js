import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
