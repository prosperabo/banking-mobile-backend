import { Request, Response } from 'express';

import { PaymentService } from '@/services/payment.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { PaymentCreateRequest } from '@/schemas/payment.schemas';

const logger = buildLogger('PaymentController');

export class PaymentController {
  /**
   * Create a new payment record with commission calculation
   */
  static createPayment = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const paymentData: PaymentCreateRequest = req.body;

    logger.info('Creating payment record', { userId });

    const payment = await PaymentService.createPayment(userId, paymentData);

    return successHandler(res, payment, 'Payment created successfully');
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
