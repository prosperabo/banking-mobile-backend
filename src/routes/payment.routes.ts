import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { PaymentController } from '@/controllers/payment.controller';
import { validateRequest } from '@/middlewares';
import {
  processPaymentValidator,
  paymentIdParamValidator,
} from '@/validators/payment.validator';

const router = Router();

router.use(authenticateToken);

// Process payment with card token
router.post(
  '/payments',
  validateRequest(...processPaymentValidator),
  PaymentController.processPayment
);

// Get payment details
router.get(
  '/payments/:paymentId',
  validateRequest(...paymentIdParamValidator),
  PaymentController.getPaymentDetails
);

export default router;
