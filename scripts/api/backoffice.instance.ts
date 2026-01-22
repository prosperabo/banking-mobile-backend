import axios from 'axios';
import { config } from '@/config';
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  InternalServerError,
} from '@/shared/errors';
import { buildLogger } from '@/utils';

const logger = buildLogger('BackOfficeInstance');

const errorMap = new Map<number, Error>([
  [400, new BadRequestError('Invalid request parameters or malformed input.')],
  [401, new UnauthorizedError('Authorization failed or invalid token.')],
  [403, new ForbiddenError('Forbidden: Invalid checksum or access denied.')],
  [404, new NotFoundError('Not Found: Resource or transaction not found.')],
  [
    409,
    new ConflictError('Conflict: Duplicate or already processed transaction.'),
  ],
  [
    422,
    new UnprocessableEntityError(
      'Unprocessable Entity: Invalid or inconsistent parameters.'
    ),
  ],
  [
    500,
    new InternalServerError(
      'Internal Server Error: Unexpected server failure.'
    ),
  ],
]);

const backOfficeInstance = axios.create({
  baseURL: config.backofficeBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Authorization-ecommerce': config.ecommerceToken,
  },
});

backOfficeInstance.interceptors.request.use(request => {
  logger.info('Outgoing request:', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: request.data,
  });
  return request;
});

backOfficeInstance.interceptors.response.use(
  response => {
    logger.info('Successful response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    const statusCode = error.response?.status;
    const businessError = error.response?.data?.error;

    logger.error('Error response:', {
      url: error.config?.url,
      status: statusCode,
      data: error.response?.data,
    });

    if (statusCode && errorMap.has(statusCode)) {
      return Promise.reject(errorMap.get(statusCode));
    }

    if (businessError?.Code) {
      return Promise.reject(
        new Error(
          `Business Error [${businessError.Code}]: ${businessError.Text}`
        )
      );
    }

    return Promise.reject(
      new Error(error.message || 'Unknown error occurred.')
    );
  }
);

export default backOfficeInstance;
