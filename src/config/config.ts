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
  banxico: {
    queryToken: process.env.BANXICO_QUERY_TOKEN || '',
    baseUrl:
      process.env.BANXICO_BASE_URL ||
      'https://www.banxico.org.mx/SieAPIRest/service/v1',
  },
  campaing: {
    campaign_id: process.env.CAMPAIGN_ID || 'SOF250820595',
    creditLine: process.env.CREDIT_LINE || '0',
    programCode: process.env.PROGRAM_CODE || 'KBZ260121860',
  },
};
