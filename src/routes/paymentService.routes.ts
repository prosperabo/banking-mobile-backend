import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { PaymentServiceController } from '@/controllers/paymentService.controller';
import { validateRequest } from '@/middlewares';
import {
  processPaymentValidator,
  paymentIdParamValidator,
} from '@/validators/paymentService.validator';

const router = Router();

router.use(authenticateToken);

// Process payment with card token
router.post(
  '/payments',
  validateRequest(...processPaymentValidator),
  PaymentServiceController.processPayment
);

// Get payment details
router.get(
  '/payments/:paymentId',
  validateRequest(...paymentIdParamValidator),
  PaymentServiceController.getPaymentDetails
);

export default router;
