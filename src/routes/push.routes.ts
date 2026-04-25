import { Router } from 'express';

import { authenticateToken } from '@/middlewares/authenticateToken';
import { validateRequest } from '@/middlewares';
import { PushController } from '@/controllers/push.controller';
import { registerDeviceValidator } from '@/validators/push.validator';

const router = Router();

router.use(authenticateToken);

router.post(
  '/register-device',
  validateRequest(...registerDeviceValidator),
  PushController.registerDevice
);

export default router;
