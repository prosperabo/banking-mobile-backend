import axios from 'axios';
import { config } from '@/config';
import { buildLogger } from '@/utils';
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from '@/shared/errors';

const logger = buildLogger('CrossmintInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('Crossmint: invalid request parameters.')],
  [401, new UnauthorizedError('Crossmint: invalid or missing API key.')],
  [403, new UnauthorizedError('Crossmint: access denied.')],
  [409, new BadRequestError('Crossmint: wallet already exists.')],
  [429, new BadRequestError('Crossmint: rate limit exceeded.')],
  [500, new InternalServerError('Crossmint: internal server error.')],
]);

const crossmintInstance = axios.create({
  baseURL: config.crossmint.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': config.crossmint.serverApiKey,
  },
});

crossmintInstance.interceptors.request.use(request => {
  logger.info('Crossmint outgoing request', {
    method: request.method,
    url: request.url,
    data: request.data,
  });
  return request;
});

crossmintInstance.interceptors.response.use(
  response => {
    logger.info('Crossmint response', {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  error => {
    const status: number | undefined = error.response?.status;
    const responseData = error.response?.data;

    logger.error('Crossmint request error', {
      status,
      url: error.config?.url,
      data: responseData,
    });

    if (status && errorMap.has(status))
      return Promise.reject(errorMap.get(status));
    return Promise.reject(
      new InternalServerError(error.message ?? 'Crossmint unknown error')
    );
  }
);

export default crossmintInstance;
