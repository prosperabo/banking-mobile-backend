import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('source-map-support/register');
}

import { buildLogger } from './utils';

const logger = buildLogger('index');

(async () => {
  try {
    const [{ config, prismaInit, registerPrismaShutdown }, { default: app }] =
      await Promise.all([import('./config'), import('./app')]);

    const { port, version } = config;

    const PORT = port || 3000;
    const API = `http://localhost:${PORT}/api/v${version}`;

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
