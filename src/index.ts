import dotenv from 'dotenv';
dotenv.config();

if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('module-alias/register');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('source-map-support/register');
}

import { config } from './config';
import { buildLogger } from './utils';
import { NodeEnv } from './shared/consts';
import app from './app';

const logger = buildLogger('index');

const { port, version, nodeEnv } = config;

const PORT = port || 3000;
const API = `http://localhost:${PORT}/api/v${version}`;

app.listen(PORT, async () => {
  if (nodeEnv === NodeEnv.DEVELOPMENT) {
    logger.info(`🚀 Server is running on ${API}`);
    return;
  }
  logger.info('🚀 Server is running!');
});
