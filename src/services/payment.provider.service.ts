import paymentServiceInstance from '@/api/paymentService.instance';
import { buildLogger } from '@/utils';
import {
  PaymentProviderAPIPaymentRequest,
  PaymentProviderPaymentResponse,
} from '@/schemas/payment.schemas';

const logger = buildLogger('PaymentProviderService');

export class PaymentProviderService {
  /**
   * Process a payment using the external payment provider API
   */
  static async processPayment(
    request: PaymentProviderAPIPaymentRequest
  ): Promise<PaymentProviderPaymentResponse> {
    logger.info('Processing payment via external provider', {
      amount: request.amount,
      currency: request.currency,
    });

    const response =
      await paymentServiceInstance.post<PaymentProviderPaymentResponse>(
        '/payments',
        request
      );

    logger.info('Payment processed via external provider', {
      paymentId: response.data.id,
      status: response.data.status,
    });

    return response.data;
  }

  /**
   * Get payment details by payment ID from the external provider
   */
  static async getPaymentDetails(
    paymentId: string
  ): Promise<PaymentProviderPaymentResponse> {
    logger.info('Fetching payment details from external provider', {
      paymentId,
    });

    const response =
      await paymentServiceInstance.get<PaymentProviderPaymentResponse>(
        `/payments/${paymentId}`
      );

    logger.info('Payment details fetched from external provider', {
      paymentId,
    });

    return response.data;
  }
}
