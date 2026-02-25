import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { sipBasicAuth } from '@/middlewares/sip.basicAuth.middleware';
import { validateRequest } from '@/middlewares';
import { BmscPaymentController } from '@/controllers/bmsc.payment.controller';
import {
  createSipQrValidator,
  sipCallbackValidator,
} from '@/validators/bmsc.payment.validator';

const router = Router();

/**
 * POST /bmsc/payments/sip/qr
 * Requires user authentication. Generates a SIP QR payment.
 */
router.post(
  '/sip/qr',
  authenticateToken,
  validateRequest(...createSipQrValidator),
  BmscPaymentController.createSipQr
);

/**
 * POST /bmsc/payments/sip/callback
 * Called by SIP to confirm a payment. Protected by Basic Auth.
 */
router.post(
  '/sip/callback',
  sipBasicAuth,
  validateRequest(...sipCallbackValidator),
  BmscPaymentController.sipCallback
);

export default router;
