import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { buildLogger } from '@/utils';

const logger = buildLogger('ExpressErrorHandler');

const errorResponseMap = new Map<
  string,
  { statusCode: number; message: string }
>([
  [
    'ValidationError',
    {
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Required fields are not supplied',
    },
  ],
  [
    'BadRequestError',
    { statusCode: StatusCodes.BAD_REQUEST, message: 'Bad request' },
  ],
  [
    'UnauthorizedError',
    { statusCode: StatusCodes.UNAUTHORIZED, message: 'Unauthorized' },
  ],
  [
    'ForbiddenError',
    { statusCode: StatusCodes.FORBIDDEN, message: 'Forbidden' },
  ],
  [
    'NotFoundError',
    { statusCode: StatusCodes.NOT_FOUND, message: 'Resource not found' },
  ],
]);

export const expressErrorHandler = (
  err: Error & { details?: unknown },
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const errorInfo = errorResponseMap.get(err.name) || {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
  };

  logger.error(`Error: ${err.message}`, {
    statusCode: errorInfo.statusCode,
    stack: err.stack,
  });

  res.status(errorInfo.statusCode).json({
    success: false,
    result: null,
    message: err.message,
    error: errorInfo.message,
    details: err.details || null,
  });
};
