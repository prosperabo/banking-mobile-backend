import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const successHandler = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = StatusCodes.OK
): void => {
  res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};
