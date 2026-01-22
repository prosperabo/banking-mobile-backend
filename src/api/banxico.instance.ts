import axios from 'axios';
import { config } from '@/config';
import { buildLogger } from '@/utils';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from '@/shared/errors';

const logger = buildLogger('BanxicoInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('Banxico: Invalid request parameters.')],
  [401, new UnauthorizedError('Banxico: Invalid or missing token.')],
  [
    403,
    new ForbiddenError(
      'Banxico: Forbidden (token disabled or limit exceeded).'
    ),
  ],
  [404, new NotFoundError('Banxico: Resource not found.')],
  [500, new InternalServerError('Banxico: Unexpected server failure.')],
]);

if (!config.banxico.queryToken) {
  logger.warn(
    'BANXICO_QUERY_TOKEN is empty. Banxico calls will fail until it is set.'
  );
}

export const banxicoInstance = axios.create({
  baseURL: config.banxico.baseUrl,
  headers: {
    Accept: 'application/json',
    'Bmx-Token': config.banxico.queryToken,
  },
  timeout: 15_000,
});

banxicoInstance.interceptors.request.use(req => {
  logger.info('Outgoing request', {
    url: req.baseURL ? `${req.baseURL}${req.url}` : req.url,
    method: req.method,
    headers: {
      ...req.headers,
      'Bmx-Token': req.headers?.['Bmx-Token'] ? '***' : undefined,
    },
    params: req.params,
  });
  return req;
});

banxicoInstance.interceptors.response.use(
  res => {
    logger.info('Successful response', {
      url: res.config.url,
      status: res.status,
    });
    return res;
  },
  err => {
    const status = err.response?.status;
    logger.error('Error response', {
      url: err.config?.url,
      status,
      data: err.response?.data,
      message: err.message,
    });

    if (status && errorMap.has(status)) {
      return Promise.reject(errorMap.get(status));
    }

    return Promise.reject(
      new Error(err.message || 'Banxico: Unknown error occurred.')
    );
  }
);
