import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('source-map-support/register');
}

import { config, prismaInit, registerPrismaShutdown } from './config';
import { buildLogger } from './utils';
import app from './app';

const logger = buildLogger('index');

const { port, version } = config;

const PORT = port || 3000;
const API = `http://localhost:${PORT}/api/v${version}`;

(async () => {
  try {
    logger.info(`Trying to start on port: ${PORT}`);
    await prismaInit();
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on ${API}`);
    });
    registerPrismaShutdown(server);
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : JSON.stringify(err);
    logger.error(`❌ Failed to start: ${message}`);
    process.exit(1);
  }
})();
