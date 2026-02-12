import { Router } from 'express';

import { AuthController } from '@/controllers/auth.controller';
import {
  loginMethodValidator,
  registerByEmailValidator,
} from '@/validators/auth.validator';
import { validateRequest } from '@/middlewares';
import { validateLoginByMethod } from '@/middlewares/validateLoginMethod';
import authBiometricRouter from './auth.biometric.routes';

const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest(...loginMethodValidator),
  validateLoginByMethod,
  AuthController.login
);

authRouter.post(
  '/register',
  validateRequest(...registerByEmailValidator),
  AuthController.registerByEmail
);

authRouter.use('/biometric', authBiometricRouter);

export default authRouter;
