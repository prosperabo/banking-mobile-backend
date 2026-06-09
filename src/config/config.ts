import dotenv from 'dotenv';
import { NodeEnv } from '@/shared/consts';
import { required, validateEnvVars } from './validate';

dotenv.config();

export const config = {
  nodeEnv:
    (process.env.NODE_ENV as keyof typeof NodeEnv) || NodeEnv.DEVELOPMENT,
  port: Number(process.env.PORT) || 3000,
  version: process.env.VERSION || '1',
  databaseUrl: required('DATABASE_URL'),
  clientUrls: String(process.env.CLIENT_URLS).split(',') || [
    'http://localhost:5173',
  ],
  apiUrl: required('API_URL'),
  backofficeBaseUrl: required('BACKOFFICE_BASE_URL'),
  ecommerceToken: required('ECOMMERCE_TOKEN'),
  oauthEndpoint: required('OAUTH_ENDPOINT'),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
  },
  paymentService: {
    apiKey: required('PAYMENT_SERVICE_API_KEY'),
    secretKey: required('PAYMENT_SERVICE_SECRET_KEY'),
    baseUrl: process.env.PAYMENT_SERVICE_BASE_URL || 'https://api.payclip.com',
  },
  banxico: {
    queryToken: process.env.BANXICO_QUERY_TOKEN || '',
    baseUrl:
      process.env.BANXICO_BASE_URL ||
      'https://www.banxico.org.mx/SieAPIRest/service/v1',
  },
  sip: {
    baseUrl: process.env.SIP_BASE_URL || '',
    apiKey: process.env.SIP_APIKEY || '',
    username: process.env.SIP_USERNAME || '',
    password: process.env.SIP_PASSWORD || '',
    apiKeyServicio: process.env.SIP_APIKEY_SERVICIO || '',
    publicCallbackUrl: process.env.SIP_PUBLIC_CALLBACK_URL || '',
    callbackBasicUser: process.env.SIP_CALLBACK_BASIC_USER || '',
    callbackBasicPass: process.env.SIP_CALLBACK_BASIC_PASS || '',
    timeoutMs: Number(process.env.SIP_TIMEOUT_MS) || 15000,
    tokenCacheTtlSeconds:
      Number(process.env.SIP_TOKEN_CACHE_TTL_SECONDS) || 3300,
  },
  binance: {
    baseUrl: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
  },
  criptoya: {
    baseUrl: process.env.CRIPTOYA_BASE_URL || 'https://criptoya.com',
  },
  campaing: {
    campaign_id: process.env.CAMPAIGN_ID || 'SOF250820595',
    creditLine: process.env.CREDIT_LINE || '0',
    programCode: process.env.PROGRAM_CODE || 'KBZ260121860',
  },
  exchangeRate: {
    usdMxnFeeRate: Number(process.env.USD_MXN_FEE_RATE) || 0.052,
    bobUsdtFeeRate: Number(process.env.BOB_USDT_FEE_RATE) || 0.012,
    usdtMxnFeeRate: Number(process.env.USDT_MXN_FEE_RATE) || 0.033,
  },
  spei: {
    cashoutFee: Number(process.env.SPEI_CASHOUT_FEE) || 0,
  },
  senderMail: {
    fromMail: process.env.FROM_MAIL || 'Prospera <info@slan.mx>',
    resendApiKey: process.env.RESEND_API_KEY || 'api_key',
  },
  crossmint: {
    serverApiKey: process.env.CROSSMINT_SERVER_API_KEY || '',
    env: process.env.CROSSMINT_ENV || 'staging',
    baseUrl:
      process.env.CROSSMINT_ENV === 'production'
        ? 'https://www.crossmint.com'
        : 'https://staging.crossmint.com',
  },
  timeZone: process.env.TIME_ZONE || 'America/Mexico_City',
  firebase: {
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
  gcpBucket: {
    projectId: required('GCS_PROJECT_ID'),
    clientEmail: required('GCS_CLIENT_EMAIL'),
    privateKey: required('GCS_PRIVATE_KEY'),
    bucketName: required('GCS_BUCKET_NAME'),
  },
  gcpFirestore: {
    projectId: required('GCP_FIRESTORE_PROJECT_ID'),
    clientEmail: required('GCP_FIRESTORE_CLIENT_EMAIL'),
    privateKey: required('GCP_FIRESTORE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    privateKeyID: required('GCP_FIRESTORE_PRIVATE_KEY_ID'),
    clientID: required('GCP_FIRESTORE_CLIENT_ID'),
  },
};

validateEnvVars();
