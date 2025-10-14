import { Router } from 'express';

import { UserController } from '@/controllers/user.controller';
import { updateUserValidator } from '@/validators/user.validator';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticateToken } from '@/middlewares/authenticateToken';

const router = Router();

router.use(authenticateToken);
router.get('/', UserController.getUser);
router.put(
  '/',
  validateRequest(...updateUserValidator),
  UserController.updateUser
);

export default router;
