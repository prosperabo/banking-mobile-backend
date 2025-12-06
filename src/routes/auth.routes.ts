import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { loginValidator, registerValidator } from '@/validators/auth.validator';
import { validateRequest } from '@/middlewares';

const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest(...loginValidator),
  validateRequest(...loginValidator),
  AuthController.login
);

authRouter.post(
  '/register',
  validateRequest(...registerValidator),
  AuthController.register
);

export default authRouter;
