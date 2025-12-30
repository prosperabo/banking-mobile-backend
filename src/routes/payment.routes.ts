import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { PaymentController } from '@/controllers/payment.controller';
import { validateRequest } from '@/middlewares';
import {
  createPaymentValidator,
  paymentIdParamValidator,
} from '@/validators/payment.validator';

const router = Router();

router.use(authenticateToken);

// Create payment record
router.post(
  '/',
  validateRequest(...createPaymentValidator),
  PaymentController.createPayment
);

// Get payment details
router.get(
  '/:paymentId',
  validateRequest(...paymentIdParamValidator),
  PaymentController.getPaymentDetails
);

export default router;
