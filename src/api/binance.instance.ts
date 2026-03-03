/**
 * Binance public API instance for exchange rates.
 */
import axios from 'axios';
import { config } from '@/config';
import { buildLogger } from '@/utils';
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from '@/shared/errors';

const logger = buildLogger('BinanceInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('Binance: invalid request parameters.')],
  [401, new UnauthorizedError('Binance: unauthorized.')],
  [403, new UnauthorizedError('Binance: access denied.')],
  [429, new BadRequestError('Binance: rate limit exceeded.')],
  [500, new InternalServerError('Binance: internal server error.')],
]);

const binanceInstance = axios.create({
  baseURL: config.binance.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

binanceInstance.interceptors.request.use(request => {
  logger.info('Binance outgoing request', {
    method: request.method,
    url: request.url,
    params: request.params,
  });
  return request;
});

binanceInstance.interceptors.response.use(
  response => {
    logger.info('Binance response', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  error => {
    const status: number | undefined = error.response?.status;
    const responseData = error.response?.data;

    logger.error('Binance request error', {
      status,
      url: error.config?.url,
      data: responseData,
    });

    if (status && errorMap.has(status))
      return Promise.reject(errorMap.get(status));
    return Promise.reject(
      new InternalServerError(error.message ?? 'Binance unknown error')
    );
  }
);

export default binanceInstance;
