import { PrismaClient } from '@prisma/client';

import { buildLogger } from '@/utils';

const logger = buildLogger('DatabaseConfig');

let prismaClient: PrismaClient | null = null;

const getPrismaClient = () => {
  if (!prismaClient) {
    prismaClient = new PrismaClient();
  }
  return prismaClient;
};

export const db = getPrismaClient();

export const prismaInit = async (): Promise<void> => {
  logger.info('Connecting to database…');
  await db.$connect();
  logger.info('Database connected');
};

export const registerPrismaShutdown = (server?: import('http').Server) => {
  const close = async (signal: NodeJS.Signals) => {
    logger.warn(`Received ${signal}. Shutting down…`);
    if (server) {
      await new Promise<void>(resolve =>
        server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        })
      );
    }
    await db.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  };

  process.on('SIGINT', close);
  process.on('SIGTERM', close);
};
