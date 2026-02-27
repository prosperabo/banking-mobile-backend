import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ValidationChain } from 'express-validator';
import { buildLogger } from '../utils/logger';

const logger = buildLogger('validateRequest');

export const validateRequest = (...schemas: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    logger.info('Validando request', {
      method: req.method,
      url: req.originalUrl,
    });
    // Apply all validation schemas
    for (const schema of schemas) {
      await schema.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Validation errors found', {
        method: req.method,
        url: req.originalUrl,
        errors: errors.array(),
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array(),
      });
    }

    logger.info('Validación exitosa', {
      method: req.method,
      url: req.originalUrl,
    });
    next();
  };
};
