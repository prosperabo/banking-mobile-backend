import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { loginValidator } from '@/validators/auth.validator';

const router = Router();
router.get('/', (_req, res) => res.send({ message: 'API is up!' }));
router.post('/auth/login', loginValidator, AuthController.login);

export default router;
