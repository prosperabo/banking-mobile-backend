import { Request, Response, NextFunction } from 'express';
import {
  loginPasswordValidator,
  loginBiometricValidator,
} from '@/validators/auth.validator';
import { validateRequest } from './validateRequest';

export const validateLoginByMethod = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const method = (req.query.method as string) ?? 'password';

  const schemas =
    method === 'biometric'
      ? loginBiometricValidator // deviceId + challengeId + signature
      : loginPasswordValidator; // email + password

  return validateRequest(...schemas)(req, res, next);
};
