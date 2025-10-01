import dotenv from 'dotenv';
import { NodeEnv } from '@/shared/consts';

dotenv.config();

export const config = {
  nodeEnv:
    (process.env.NODE_ENV as keyof typeof NodeEnv) || NodeEnv.DEVELOPMENT,
  port: Number(process.env.PORT) || 3000,
  version: process.env.VERSION || '1',
  databaseUrl: process.env.DATABASE_URL || 'database_url',
  clientUrls: String(process.env.CLIENT_URLS).split(',') || [
    'http://localhost:5173',
  ],
  backofficeBaseUrl: process.env.BACKOFFICE_BASE_URL,
  ecommerceToken: process.env.ECOMMERCE_TOKEN,
  oauthEndpoint: process.env.OAUTH_ENDPOINT,
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  webhookToleranceSeconds: Number(process.env.WEBHOOK_TOLERANCE_SECONDS) || 300,
};
