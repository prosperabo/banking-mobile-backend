import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { loginValidator } from '@/validators/auth.validator';
import { validateRequest } from '@/middlewares';

const authRouter = Router();

authRouter.post(
  '/login',
  validateRequest(...loginValidator),
  AuthController.login
);

export default authRouter;
