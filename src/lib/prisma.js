import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

import { env } from './env.js';

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
