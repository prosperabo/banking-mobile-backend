import { Router } from 'express';
import { TwoFactorController } from '@/controllers/twoFactor.controller';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { validateTempToken } from '@/middlewares/validateTempToken';
import { validateRequest } from '@/middlewares';
import {
  verifySetupValidator,
  verifyLoginCodeValidator,
  disableTwoFactorValidator,
} from '@/validators/twoFactor.validator';

const router = Router();

// Setup 2FA - requires normal authentication
router.post('/setup', authenticateToken, TwoFactorController.setup);

// Verify and activate 2FA - requires normal authentication
router.post(
  '/verify-setup',
  authenticateToken,
  validateRequest(...verifySetupValidator),
  TwoFactorController.verifySetup
);

// Verify code during login - requires temp token
router.post(
  '/verify',
  validateTempToken,
  validateRequest(...verifyLoginCodeValidator),
  TwoFactorController.verifyLogin
);

// Get 2FA status - requires normal authentication
router.get('/status', authenticateToken, TwoFactorController.getStatus);

// Disable 2FA - requires normal authentication
router.post(
  '/disable',
  authenticateToken,
  validateRequest(...disableTwoFactorValidator),
  TwoFactorController.disable
);

export default router;
