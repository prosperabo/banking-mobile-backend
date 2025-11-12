import { config } from './config';
import { db, prismaInit, registerPrismaShutdown } from './prisma';

export { config, db, prismaInit, registerPrismaShutdown };
