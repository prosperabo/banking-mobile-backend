import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
};

export const db = getPrismaClient();
