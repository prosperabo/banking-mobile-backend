/**
 * SIP Axios instance for the payments API (/api/v1/*).
 *
 * Follows the same synchronous-interceptor pattern as backoffice.instance.
 * Token injection and 401-retry live in src/utils/sip.utils.ts to keep
 * this layer purely synchronous and compatible with @types/axios.
 */
import axios from 'axios';
import { config } from '@/config';
import { buildLogger } from '@/utils';
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from '@/shared/errors';

const logger = buildLogger('SipInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('SIP: invalid request parameters.')],
  [401, new UnauthorizedError('SIP: token expired or invalid.')],
  [403, new UnauthorizedError('SIP: access denied.')],
  [500, new InternalServerError('SIP: internal server error.')],
]);

const sipInstance = axios.create({
  baseURL: config.sip.baseUrl,
  timeout: config.sip.timeoutMs,
  headers: {
    'Content-Type': 'application/json',
    apikeyServicio: config.sip.apiKeyServicio,
  },
});

sipInstance.interceptors.request.use(request => {
  // Log URL only – never log token values
  logger.info('SIP outgoing request', {
    method: request.method,
    url: request.url,
  });
  return request;
});

sipInstance.interceptors.response.use(
  response => {
    logger.info('SIP response', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  error => {
    const status: number | undefined = error.response?.status;
    const responseData = error.response?.data;

    logger.error('SIP request error', {
      status,
      url: error.config?.url,
      data: responseData,
    });

    if (status && errorMap.has(status))
      return Promise.reject(errorMap.get(status));
    return Promise.reject(
      new InternalServerError(error.message ?? 'SIP unknown error')
    );
  }
);

export default sipInstance;
