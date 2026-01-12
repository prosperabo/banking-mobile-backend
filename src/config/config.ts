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
  apiUrl: process.env.API_URL,
  backofficeBaseUrl: process.env.BACKOFFICE_BASE_URL,
  ecommerceToken: process.env.ECOMMERCE_TOKEN,
  oauthEndpoint: process.env.OAUTH_ENDPOINT,
  webhookSecret: process.env.WEBHOOK_SECRET || '',
  webhookToleranceSeconds: Number(process.env.WEBHOOK_TOLERANCE_SECONDS) || 300,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
  },
  paymentService: {
    apiKey: process.env.PAYMENT_SERVICE_API_KEY || '',
    secretKey: process.env.PAYMENT_SERVICE_SECRET_KEY || '',
    baseUrl: process.env.PAYMENT_SERVICE_BASE_URL || 'https://api.payclip.com',
  },
  twoFactor: {
    issuer: process.env.TWO_FACTOR_ISSUER,
    encryptionKey: process.env.TWO_FACTOR_ENCRYPTION_KEY,
    tempTokenExpiry: Number(process.env.TWO_FACTOR_TEMP_TOKEN_EXPIRY),
  },
};
