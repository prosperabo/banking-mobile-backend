import { Request, Response } from 'express';

import { PaymentService } from '@/services/payment.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { PaymentServicePaymentRequest } from '@/schemas/payment.schemas';

const logger = buildLogger('PaymentServiceController');

export class PaymentController {
  /**
   * Process a new payment
   */
  static processPayment = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const paymentData: PaymentServicePaymentRequest = req.body;

    logger.info('Processing payment request', { userId });

    const result = await PaymentService.processPayment(userId, paymentData);

    return successHandler(res, result, 'Payment processed successfully');
  });

  /**
   * Get payment details
   */
  static getPaymentDetails = catchErrors(
    async (req: Request, res: Response) => {
      const { paymentId } = req.params;

      logger.info('Fetching payment details', { paymentId });

      const result = await PaymentService.getPaymentDetails(paymentId);

      return successHandler(
        res,
        result,
        'Payment details fetched successfully'
      );
    }
  );
}
