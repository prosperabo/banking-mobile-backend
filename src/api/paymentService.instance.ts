import axios from 'axios';
import { config } from '@/config';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  UnprocessableEntityError,
  InternalServerError,
} from '@/shared/errors';
import { buildLogger } from '@/utils';
import { buildBasicAuthToken } from '@/utils/basicAuth';

const logger = buildLogger('PaymentServiceInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('Invalid request parameters.')],
  [401, new UnauthorizedError('Invalid API Key or authentication failed.')],
  [402, new BadRequestError('Insufficient funds or payment declined.')],
  [404, new NotFoundError('Payment or resource not found.')],
  [
    422,
    new UnprocessableEntityError('Invalid payment parameters or card data.'),
  ],
  [
    500,
    new InternalServerError('Payment API error: Unexpected server failure.'),
  ],
  [503, new InternalServerError('Payment API temporarily unavailable.')],
]);

const paymentServiceInstance = axios.create({
  baseURL: config.paymentService.baseUrl,
  headers: {
    'Content-Type': 'application/json',
    Authorization: buildBasicAuthToken(
      config.paymentService.apiKey,
      config.paymentService.secretKey
    ),
  },
});

paymentServiceInstance.interceptors.request.use(request => {
  logger.info('Outgoing Payment API request:', {
    url: request.url,
    method: request.method,
    headers: {
      ...request.headers,
      Authorization: '[REDACTED]',
    },
    data: request.data,
  });
  return request;
});

paymentServiceInstance.interceptors.response.use(
  response => {
    logger.info('Payment API successful response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    const statusCode = error.response?.status;
    const responseData = error.response?.data as
      | { message?: string }
      | undefined;

    logger.error('Payment API error response:', {
      url: error.config?.url,
      status: statusCode,
      data: responseData,
    });

    if (statusCode && errorMap.has(statusCode)) {
      return Promise.reject(errorMap.get(statusCode));
    }

    if (responseData?.message) {
      return Promise.reject(
        new Error(`Payment API Error: ${responseData.message}`)
      );
    }

    return Promise.reject(
      new Error(error.message || 'Unknown Payment API error occurred.')
    );
  }
);

export default paymentServiceInstance;
