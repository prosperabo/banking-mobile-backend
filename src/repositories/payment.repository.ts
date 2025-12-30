import { db } from '@/config/prisma';
import { buildLogger } from '@/utils';
import {
  PaymentCreateRequest,
  PaymentStatus,
  PaymentProvider,
  PaymentProviderPaymentResponse,
} from '@/schemas/payment.schemas';
import { PaymentFeeCalculation } from '@/utils/payment.utils';

const logger = buildLogger('PaymentRepository');

export class PaymentRepository {
  /**
   * Create a new payment record in the database
   */
  static async createPayment(
    userId: number,
    paymentData: PaymentCreateRequest,
    fees: PaymentFeeCalculation,
    idempotencyKey: string
  ) {
    const { amount, currency = 'MXN', description } = paymentData;

    logger.info('Creating payment record', {
      userId,
      amount,
      businessFeeAmount: fees.businessFeeAmount,
      netAmount: fees.netAmount,
    });

    const payment = await db.payments.create({
      data: {
        user_id: userId,
        amount,
        currency,
        description: description || 'Payment via banking app',
        business_fee_rate: fees.businessFeeRate,
        business_fee_amount: fees.businessFeeAmount,
        idempotency_key: idempotencyKey,
        net_amount: fees.netAmount,
        status: PaymentStatus.PENDING,
        payment_method: 'card',
        provider: PaymentProvider.CLIP,
      },
    });

    logger.info('Payment record created', { paymentId: payment.id });

    return payment;
  }

  /**
   * Get payment details by ID
   */
  static async getPaymentById(paymentId: number) {
    logger.info('Fetching payment by ID', { paymentId });

    const payment = await db.payments.findUnique({
      where: { id: paymentId },
    });

    return payment;
  }

  /**
   * Get payments by user ID
   */
  static async getPaymentsByUserId(userId: number) {
    logger.info('Fetching payments by user ID', { userId });

    const payments = await db.payments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return payments;
  }

  /**
   * Update payment status and details after processing
   */
  static async updatePaymentStatus(
    paymentId: number,
    status: PaymentStatus,
    providerPaymentId?: string,
    responsePayload?: PaymentProviderPaymentResponse
  ) {
    logger.info('Updating payment status', { paymentId, status });

    const payment = await db.payments.update({
      where: { id: paymentId },
      data: {
        status,
        provider_payment_id: providerPaymentId,
        response_payload: { ...responsePayload },
        updated_at: new Date(),
      },
    });

    return payment;
  }
}
