import paymentServiceInstance from '@/api/paymentService.instance';
import { PaymentRepository } from '@/repositories/payment.repository';
import { buildLogger, paymentUtils } from '@/utils';
import {
  PaymentCreateRequest,
  PaymentServiceCreateResponse,
  PaymentServicePaymentRequest,
  PaymentProviderAPIPaymentRequest,
  PaymentProviderPaymentResponse,
  PaymentServiceClientResponse,
  PaymentStatus,
} from '@/schemas/payment.schemas';

const logger = buildLogger('PaymentService');

export class PaymentService {
  /**
   * Create a new payment record with commission calculation
   */
  static async createPayment(
    userId: number,
    paymentData: PaymentCreateRequest
  ): Promise<PaymentServiceCreateResponse> {
    const { amount } = paymentData;

    logger.info('Creating payment record', { userId, amount });

    const fees = paymentUtils.calculatePaymentFees(amount);
    const idempotencyKey = paymentUtils.generateIdempotencyKey();

    const payment = await PaymentRepository.createPayment(
      userId,
      paymentData,
      fees,
      idempotencyKey
    );

    // Generate mock payment URL
    const paymentUrl = `https://payment-gateway.com/pay/${payment.id}`;

    const response: PaymentServiceCreateResponse = {
      paymentId: Number(payment.id),
      amount: Number(payment.amount),
      currency: payment.currency,
      description: payment.description || undefined,
      status: payment.status as PaymentStatus,
      paymentUrl,
      createdAt: payment.created_at,
    };

    return response;
  }

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
   * Get payment details by payment ID from provider
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
