import { Response, Request, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

import { buildLogger } from '@/shared/utils/logger';

const logger = buildLogger('ErrorHandler');

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

export const catchErrors = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): ((req: Request, res: Response, next: NextFunction) => void) => {
  return (req, res, next): void => {
    Promise.resolve(fn(req, res, next)).catch(error => {
      const errorInfo = errorResponseMap.get(error.name) || {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
      };

      logger.error(`Error: ${error.message}`, {
        statusCode: errorInfo.statusCode,
        stack: error.stack,
      });

      res.status(errorInfo.statusCode).json({
        success: false,
        result: null,
        message: error.message,
        error: errorInfo.message,
        details: error.details || null,
      });
    });
  };
};
