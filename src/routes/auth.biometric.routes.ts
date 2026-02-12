import { Router } from 'express';

import { validateRequest } from '@/middlewares';
import { authenticateToken } from '@/middlewares/authenticateToken';
import {
  biometricEnrollValidator,
  biometricChallengeValidator,
} from '@/validators/auth.biometric.validator';
import { BiometricAuthController } from '@/controllers/auth.biometric.controller';

const biometricRouter = Router();

biometricRouter.post(
  '/enroll',
  authenticateToken,
  validateRequest(...biometricEnrollValidator),
  BiometricAuthController.enroll
);

biometricRouter.post(
  '/challenge',
  validateRequest(...biometricChallengeValidator),
  BiometricAuthController.challenge
);

export default biometricRouter;
