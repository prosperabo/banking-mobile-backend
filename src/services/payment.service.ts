import paymentServiceInstance from '@/api/paymentService.instance';
import { buildLogger } from '@/utils';
import {
  PaymentServicePaymentRequest,
  PaymentProviderAPIPaymentRequest,
  PaymentProviderPaymentResponse,
  PaymentServiceClientResponse,
} from '@/schemas/payment.schemas';

const logger = buildLogger('PaymentService');

export class PaymentService {
  /**
   * Process a payment using Payment Provider API
   */
  static async processPayment(
    userId: number,
    paymentData: PaymentServicePaymentRequest
  ): Promise<PaymentServiceClientResponse> {
    const {
      card_token,
      amount,
      currency = 'MXN',
      description,
      customer,
      metadata,
    } = paymentData;

    logger.info('Processing payment', {
      userId,
      amount,
      currency,
    });

    // Prepare request for Payment Provider API
    const providerRequest: PaymentProviderAPIPaymentRequest = {
      amount,
      currency,
      description: description || 'Payment via banking app',
      payment_method: {
        token: card_token,
      },
      customer,
      metadata: {
        ...metadata,
        userId,
      },
    };

    const response =
      await paymentServiceInstance.post<PaymentProviderPaymentResponse>(
        '/payments',
        providerRequest
      );

    const payment = response.data;

    logger.info('Payment processed successfully', {
      paymentId: payment.id,
      status: payment.status,
      userId,
    });

    // TODO: Save to database here
    // await PaymentRepository.create({...})

    // Return simplified response
    return this.mapToClientResponse(payment);
  }

  /**
   * Get payment details by payment ID
   */
  static async getPaymentDetails(
    paymentId: string
  ): Promise<PaymentServiceClientResponse> {
    logger.info('Fetching payment details', { paymentId });

    const response =
      await paymentServiceInstance.get<PaymentProviderPaymentResponse>(
        `/payments/${paymentId}`
      );

    logger.info('Payment details fetched', { paymentId });

    return this.mapToClientResponse(response.data);
  }

  /**
   * Map Payment Provider API response to client-friendly format
   */
  private static mapToClientResponse(
    payment: PaymentProviderPaymentResponse
  ): PaymentServiceClientResponse {
    return {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      statusMessage: payment.status_detail.message,
      receiptNo: payment.receipt_no,
      approvedAt: payment.approved_at,
      card: payment.payment_method.card
        ? {
            lastDigits: payment.payment_method.card.last_digits,
            type: payment.payment_method.type,
            issuer: payment.payment_method.card.issuer,
          }
        : undefined,
    };
  }
}
