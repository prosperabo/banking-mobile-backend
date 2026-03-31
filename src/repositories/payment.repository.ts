import { Prisma } from '@prisma/client';
import { db } from '@/config/prisma';
import { buildLogger } from '@/utils';
import {
  ClipWebhookPayload,
  PaymentCreateRequest,
  PaymentStatus,
  PaymentProvider,
  PaymentProviderPaymentResponse,
  PaymentProviderAPIPaymentRequest,
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

    logger.info('Payment record created', { paymentId: payment.id.toString() });

    return payment;
  }

  /**
   * Get payment details by ID
   */
  static async getPaymentById(paymentId: number) {
    logger.info('Fetching payment by ID', { paymentId });

    const payment = await db.payments.findUnique({
      where: { id: paymentId },
      include: {
        Users: true,
      },
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

  static async getPaymentByProviderPaymentId(
    provider: PaymentProvider,
    providerPaymentId: string
  ) {
    logger.info('Fetching payment by provider payment ID', {
      provider,
      providerPaymentId,
    });

    return db.payments.findFirst({
      where: {
        provider,
        provider_payment_id: providerPaymentId,
      },
      include: {
        Users: {
          include: {
            BackofficeAuthState: true,
          },
        },
      },
    });
  }

  /**
   * Update payment status and details after processing
   */
  static async updatePaymentStatus(
    paymentId: number,
    status: PaymentStatus,
    providerPaymentId?: string,
    responsePayload?: PaymentProviderPaymentResponse,
    requestPayload?: PaymentProviderAPIPaymentRequest
  ) {
    logger.info('Updating payment status', { paymentId, status });

    const updateData: {
      status: PaymentStatus;
      updated_at: Date;
      provider_payment_id?: string;
      response_payload?: PaymentProviderPaymentResponse;
      request_payload?: PaymentProviderAPIPaymentRequest;
    } = {
      status,
      updated_at: new Date(),
    };

    if (providerPaymentId) {
      updateData.provider_payment_id = providerPaymentId;
    }

    if (responsePayload) {
      updateData.response_payload = responsePayload;
    }

    if (requestPayload) {
      updateData.request_payload = requestPayload;
    }

    const payment = await db.payments.update({
      where: { id: paymentId },
      data: {
        status: updateData.status,
        provider_payment_id: updateData.provider_payment_id,
        request_payload: { ...updateData.request_payload },
        response_payload: { ...updateData.response_payload },
      },
    });

    return payment;
  }

  static async mergeWebhookProcessingResult(
    paymentId: bigint,
    status: PaymentStatus,
    params: {
      providerPayload?: PaymentProviderPaymentResponse;
      webhookPayload?: ClipWebhookPayload;
      topup?: Record<string, unknown>;
    }
  ) {
    const existing = await db.payments.findUnique({
      where: { id: paymentId },
      select: { response_payload: true },
    });

    const currentPayload =
      (existing?.response_payload as Record<string, unknown> | null) ?? {};

    const mergedPayload = {
      ...currentPayload,
      ...(params.providerPayload
        ? { providerPayment: params.providerPayload }
        : {}),
      ...(params.webhookPayload ? { clipWebhook: params.webhookPayload } : {}),
      ...(params.topup ? { topup: params.topup } : {}),
    };

    return db.payments.update({
      where: { id: paymentId },
      data: {
        status,
        response_payload: mergedPayload as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    });
  }

  static async findTopupTransaction(externalTransactionId: string) {
    return db.transactions.findFirst({
      where: { externalTransactionId },
    });
  }

  static async createOrUpdateTopupTransaction(params: {
    externalTransactionId: string;
    userId: number;
    amount: number;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    description: string;
    prosperaReference: string;
  }) {
    const existing = await this.findTopupTransaction(
      params.externalTransactionId
    );

    if (existing) {
      return db.transactions.update({
        where: { id: existing.id },
        data: {
          amount: params.amount,
          status: params.status,
          description: params.description,
          prosperaReference: params.prosperaReference,
          updatedAt: new Date(),
        },
      });
    }

    return db.transactions.create({
      data: {
        userId: params.userId,
        type: 'TOPUP',
        amount: params.amount,
        status: params.status,
        description: params.description,
        externalTransactionId: params.externalTransactionId,
        prosperaReference: params.prosperaReference,
        updatedAt: new Date(),
      },
    });
  }
}
