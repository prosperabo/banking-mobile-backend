import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import {
  loginValidator,
  registerByEmailValidator,
} from '@/validators/auth.validator';
import { validateRequest } from '@/middlewares';

const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest(...loginValidator),
  AuthController.login
);

authRouter.post(
  '/register',
  validateRequest(...registerByEmailValidator),
  AuthController.registerByEmail
);

export default authRouter;
