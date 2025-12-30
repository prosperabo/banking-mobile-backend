import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { PaymentController } from '@/controllers/payment.controller';
import { validateRequest } from '@/middlewares';
import {
  createPaymentValidator,
  paymentIdParamValidator,
  processPaymentValidator,
} from '@/validators/payment.validator';

const router = Router();

router.post(
  '/',
  authenticateToken,
  validateRequest(...createPaymentValidator),
  PaymentController.createPayment
);

router.post(
  '/process/:paymentId',
  validateRequest(...paymentIdParamValidator, ...processPaymentValidator),
  PaymentController.processPayment
);

router.get(
  '/:paymentId',
  authenticateToken,
  validateRequest(...paymentIdParamValidator),
  PaymentController.getPaymentDetails
);

export default router;
