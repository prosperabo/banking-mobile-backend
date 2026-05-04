import { Prisma, payments_status } from '@prisma/client';
import { db } from '@/config/prisma';
import { buildLogger } from '@/utils';
import {
  SIP_PROVIDER,
  SIP_PAYMENT_METHOD,
  CreateSipPaymentInput,
  UpdateSipQrResponseInput,
  CompleteSipPaymentInput,
} from '@/schemas/sip.schemas';

const logger = buildLogger('BmscPaymentRepository');

// ─── Repository ───────────────────────────────────────────────────────────────

export class BmscPaymentRepository {
  /**
   * Create an initial PROCESSING payment record.
   * Throws if idempotency_key already exists (unique constraint from DB).
   */
  static async createSipPayment(input: CreateSipPaymentInput) {
    const {
      userId,
      orderId,
      amount,
      currency,
      description,
      idempotencyKey,
      requestPayload,
    } = input;

    logger.info('Creating SIP payment record', { userId, orderId });

    const payment = await db.payments.create({
      data: {
        user_id: userId,
        order_id: orderId,
        provider: SIP_PROVIDER,
        amount: new Prisma.Decimal(amount),
        currency,
        description: description.slice(0, 255),
        business_fee_rate: new Prisma.Decimal(0),
        business_fee_amount: new Prisma.Decimal(0),
        net_amount: new Prisma.Decimal(0),
        net_amount_mxn: new Prisma.Decimal(input.netAmountMxn ?? 0),
        status: payments_status.PENDING,
        payment_method: SIP_PAYMENT_METHOD,
        idempotency_key: idempotencyKey,
        request_payload: requestPayload as unknown as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    });

    logger.info('SIP payment record created', {
      paymentId: payment.id.toString(),
    });

    return payment;
  }

  /**
   * Find a payment by idempotency key (for idempotent QR creation).
   */
  static async findByIdempotencyKey(key: string) {
    return db.payments.findUnique({
      where: { idempotency_key: key },
    });
  }

  /**
   * Find a SIP payment by order_id (alias).
   */
  static async findByOrderId(orderId: string) {
    return db.payments.findFirst({
      where: {
        provider: SIP_PROVIDER,
        order_id: orderId,
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
   * Save idQr and SIP response after successful QR generation.
   */
  static async saveSipQrResponse(input: UpdateSipQrResponseInput) {
    const { paymentId, idQr, sipResponsePayload } = input;

    logger.info('Saving SIP QR response', {
      paymentId: paymentId.toString(),
      idQr,
    });

    return db.payments.update({
      where: { id: paymentId },
      data: {
        provider_payment_id: idQr,
        response_payload:
          sipResponsePayload as unknown as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Mark a payment as FAILED with a reason stored in response_payload.
   */
  static async markFailed(paymentId: bigint, reason: Record<string, unknown>) {
    logger.warn('Marking SIP payment as FAILED', {
      paymentId: paymentId.toString(),
    });

    return db.payments.update({
      where: { id: paymentId },
      data: {
        status: payments_status.FAILED,
        response_payload: reason as unknown as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Mark payment COMPLETED and store callback payload.
   * Merges callback into existing response_payload.
   */
  static async completeSipPayment(input: CompleteSipPaymentInput) {
    const { paymentId, callbackPayload } = input;

    logger.info('Completing SIP payment', {
      paymentId: paymentId.toString(),
    });

    const existing = await db.payments.findUnique({
      where: { id: paymentId },
      select: { response_payload: true },
    });

    const mergedPayload = {
      ...((existing?.response_payload as Record<string, unknown> | null) ?? {}),
      callback: callbackPayload,
    };

    return db.payments.update({
      where: { id: paymentId },
      data: {
        status: payments_status.COMPLETED,
        response_payload: mergedPayload as unknown as Prisma.InputJsonValue,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Create a TOPUP transaction if one doesn't already exist for the given
   * external reference (idempotent by prosperaReference).
   */
  static async createTopupIfNotExists(
    userId: number,
    amount: Prisma.Decimal,
    prosperaReference: string,
    description: string
  ) {
    const existing = await db.transactions.findFirst({
      where: { prosperaReference },
    });

    if (existing) {
      logger.info('TOPUP already exists, skipping', { prosperaReference });
      return existing;
    }

    logger.info('Creating TOPUP transaction', { userId, prosperaReference });

    return db.transactions.create({
      data: {
        userId,
        type: 'TOPUP',
        amount,
        status: 'COMPLETED',
        description,
        prosperaReference,
        updatedAt: new Date(),
      },
    });
  }
}
