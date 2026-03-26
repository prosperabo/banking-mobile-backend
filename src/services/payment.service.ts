import { PaymentRepository } from '@/repositories/payment.repository';
import { buildLogger, paymentUtils } from '@/utils';
import { PaymentProviderService } from './payment.provider.service';
import {
  PaymentCreateRequest,
  PaymentServiceCreateResponse,
  ProcessPaymentRequest,
  PaymentProviderAPIPaymentRequest,
  PaymentProviderPaymentResponse,
  PaymentServiceClientResponse,
  PaymentStatus,
} from '@/schemas/payment.schemas';
import { BadRequestError } from '@/shared/errors';
import { config } from '@/config';
import { mapClipStatusToInternal } from '@/utils/payment.utils';

const logger = buildLogger('PaymentService');

export class PaymentService {
  private static readonly CHECKOUT_ENDPOINT = '/public/checkout.html';
  private static readonly BASE_API_URL = config.apiUrl;

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
      { ...paymentData, amount: fees.grossAmount },
      fees,
      idempotencyKey
    );

    // Generate mock payment URL
    const paymentUrl = `${this.BASE_API_URL}${this.CHECKOUT_ENDPOINT}?paymentId=${payment.id}`;

    const response: PaymentServiceCreateResponse = {
      paymentId: payment.id.toString(),
      amount: payment.amount.toNumber(),
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
    paymentId: number,
    paymentData: ProcessPaymentRequest
  ): Promise<PaymentServiceClientResponse> {
    logger.info('Processing payment', { paymentId });

    const dbPayment = await PaymentRepository.getPaymentById(paymentId);

    if (!dbPayment) {
      throw new BadRequestError('Payment not found');
    }

    if (dbPayment.status !== PaymentStatus.PENDING) {
      throw new BadRequestError('Payment has already been processed');
    }

    const providerRequest: PaymentProviderAPIPaymentRequest = {
      amount: dbPayment.amount.toNumber(),
      currency: dbPayment.currency,
      description: dbPayment.description || 'Payment via banking app',
      payment_method: {
        token: paymentData.card_token,
      },
      customer: {
        email: dbPayment.Users.email,
        phone: dbPayment.Users.phone,
      },
      ...(paymentData.prevention_data && {
        prevention_data: paymentData.prevention_data,
      }),
    };

    await PaymentRepository.updatePaymentStatus(
      paymentId,
      PaymentStatus.PENDING,
      undefined,
      undefined,
      providerRequest
    );

    const payment =
      await PaymentProviderService.processPayment(providerRequest);

    logger.info('Payment processed successfully', {
      paymentId: payment.id,
      status: payment.status,
    });

    await PaymentRepository.updatePaymentStatus(
      paymentId,
      mapClipStatusToInternal(payment.status),
      payment.id,
      payment
    );

    return this.mapToClientResponse(payment);
  }

  /**
   * Get payment details by payment ID from provider
   */
  static async getPaymentDetails(
    paymentId: string
  ): Promise<PaymentServiceClientResponse> {
    logger.info('Fetching payment details', { paymentId });

    const payment = await PaymentProviderService.getPaymentDetails(paymentId);

    logger.info('Payment details fetched', { paymentId });

    return this.mapToClientResponse(payment);
  }

  /**
   * Verify payment status after 3DS authentication
   */
  static async verifyPaymentStatus(
    dbPaymentId: number
  ): Promise<PaymentServiceClientResponse> {
    logger.info('Verifying payment status after 3DS', { dbPaymentId });

    const dbPayment = await PaymentRepository.getPaymentById(dbPaymentId);

    if (!dbPayment) {
      throw new BadRequestError('Payment not found');
    }

    if (!dbPayment.provider_payment_id) {
      throw new BadRequestError(
        'Payment has not been submitted to provider yet'
      );
    }

    const payment = await PaymentProviderService.getPaymentDetails(
      dbPayment.provider_payment_id
    );

    await PaymentRepository.updatePaymentStatus(
      dbPaymentId,
      mapClipStatusToInternal(payment.status),
      payment.id,
      payment
    );

    logger.info('Payment status verified', {
      dbPaymentId,
      status: payment.status,
    });

    return this.mapToClientResponse(payment);
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
      status: mapClipStatusToInternal(payment.status),
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
      pendingAction: payment.pending_action
        ? {
            type: payment.pending_action.type,
            url: payment.pending_action.url,
          }
        : undefined,
    };
  }
}
