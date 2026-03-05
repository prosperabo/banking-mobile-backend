/**
 * CriptoYa public API instance for exchange rates.
 */
import axios from 'axios';
import { config } from '@/config';
import { buildLogger } from '@/utils';
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError,
} from '@/shared/errors';

const logger = buildLogger('CriptoyaInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('CriptoYa: invalid request parameters.')],
  [401, new UnauthorizedError('CriptoYa: unauthorized.')],
  [403, new UnauthorizedError('CriptoYa: access denied.')],
  [429, new BadRequestError('CriptoYa: rate limit exceeded.')],
  [500, new InternalServerError('CriptoYa: internal server error.')],
]);

const criptoyaInstance = axios.create({
  baseURL: config.criptoya.baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

criptoyaInstance.interceptors.request.use(request => {
  logger.info('CriptoYa outgoing request', {
    method: request.method,
    url: request.url,
  });
  return request;
});

criptoyaInstance.interceptors.response.use(
  response => {
    logger.info('CriptoYa response', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  error => {
    const status: number | undefined = error.response?.status;
    const responseData = error.response?.data;

    logger.error('CriptoYa request error', {
      status,
      url: error.config?.url,
      data: responseData,
    });

    if (status && errorMap.has(status))
      return Promise.reject(errorMap.get(status));
    return Promise.reject(
      new InternalServerError(error.message ?? 'CriptoYa unknown error')
    );
  }
);

export default criptoyaInstance;
