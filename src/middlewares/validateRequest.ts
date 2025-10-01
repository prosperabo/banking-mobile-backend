import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ValidationChain } from 'express-validator';

export const validateRequest = (...schemas: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Apply all validation schemas
    for (const schema of schemas) {
      await schema.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array(),
      });
    }

    next();
  };
};
