import { PaymentRepository } from '@/repositories/payment.repository';
import { buildLogger, paymentUtils } from '@/utils';
import {
  buildTopupRequestFromPayment,
  buildTopupPayloadFromRequest,
} from '@/utils/topup.utils';
import { PaymentProviderService } from './payment.provider.service';
import { TopupBackofficeService } from './topup.backoffice.service';
import {
  ClipWebhookPayload,
  ClipWebhookProcessResponse,
  PaymentCreateRequest,
  PaymentProvider,
  PaymentServiceCreateResponse,
  ProcessPaymentRequest,
  PaymentProviderAPIPaymentRequest,
  PaymentProviderPaymentResponse,
  PaymentServiceClientResponse,
  PaymentTopupPayload,
  PaymentStatus,
} from '@/schemas/payment.schemas';
import { BadRequestError, ConflictError, NotFoundError } from '@/shared/errors';
import { config } from '@/config';
import {
  extractClipWebhookPaymentId,
  mapClipStatusToInternal,
} from '@/utils/payment.utils';
import { ReceiptData } from '../schemas/receipt.schemas';
import { PaymentConst } from '../shared/consts';
import { sendPaymentProofByEmail } from '../utils/proofPayment.utils';
import { NotificationService } from './notification.service';

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
      ...(config.apiUrl && {
        webhook_url: `${config.apiUrl}/api/v${config.version}/webhooks/clip/payment`,
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

    const preWebhookStatus = this.mapClipStatusBeforeWebhook(payment.status);

    await PaymentRepository.updatePaymentStatus(
      paymentId,
      preWebhookStatus,
      payment.id,
      payment
    );

    return this.mapToClientResponse(payment, preWebhookStatus);
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

    const preWebhookStatus = this.mapClipStatusBeforeWebhook(payment.status);

    await PaymentRepository.updatePaymentStatus(
      dbPaymentId,
      preWebhookStatus,
      payment.id,
      payment
    );

    logger.info('Payment status verified', {
      dbPaymentId,
      status: payment.status,
    });

    return this.mapToClientResponse(payment, preWebhookStatus);
  }

  static async handleClipWebhook(
    payload: ClipWebhookPayload
  ): Promise<ClipWebhookProcessResponse> {
    const providerPaymentId = extractClipWebhookPaymentId(payload);

    if (!providerPaymentId) {
      throw new BadRequestError(
        'Clip webhook does not include a payment identifier'
      );
    }

    const dbPayment = await PaymentRepository.getPaymentByProviderPaymentId(
      PaymentProvider.CLIP,
      providerPaymentId
    );

    if (!dbPayment) {
      logger.warn('Clip webhook payment not found locally', {
        providerPaymentId,
      });
      throw new NotFoundError('Payment not found for Clip webhook');
    }

    const lockName = dbPayment.idempotency_key;
    const lockAcquired = await PaymentRepository.acquirePaymentLock(lockName);

    if (!lockAcquired) {
      throw new ConflictError('Clip webhook is already being processed');
    }

    try {
      const lockedPayment =
        await PaymentRepository.getPaymentByProviderPaymentId(
          PaymentProvider.CLIP,
          providerPaymentId
        );

      logger.info('Payment lock acquired for Clip webhook', {
        paymentId: lockedPayment?.id.toString(),
        paymentRaw: lockedPayment,
      });

      if (!lockedPayment) {
        throw new NotFoundError('Payment not found for Clip webhook');
      }

      const providerPayment = await this.getConfirmedProviderPayment(
        providerPaymentId,
        payload
      );

      const internalStatus = mapClipStatusToInternal(providerPayment.status);

      logger.info('Clip webhook received', {
        paymentId: lockedPayment.id.toString(),
        providerPaymentId,
        providerStatus: providerPayment.status,
        internalStatus,
      });

      const receiptPaymentData: ReceiptData = {
        amount: providerPayment.amount,
        currency: providerPayment.currency,
        reference: lockedPayment.id.toString(),
        recipient:
          providerPayment.customer.first_name +
          ' ' +
          providerPayment.customer.last_name,
      };

      if (internalStatus !== PaymentStatus.COMPLETED) {
        await PaymentRepository.mergeWebhookProcessingResult(
          lockedPayment.id,
          internalStatus,
          {
            providerPayload: providerPayment,
            webhookPayload: payload,
          }
        );

        logger.info('Clip webhook processed without topup', {
          paymentId: lockedPayment.id.toString(),
          providerPaymentId,
          status: internalStatus,
        });

        const linkProofPaymentSent = await sendPaymentProofByEmail(
          PaymentConst.link,
          lockedPayment.Users.email,
          receiptPaymentData,
          [{ type: 'from-email', format: 'image', filename: 'comprobante.png' }]
        );

        logger.debug('Link proof of payment email sent', {
          result: linkProofPaymentSent,
        });

        return {
          providerPaymentId,
          paymentId: lockedPayment.id.toString(),
          status: internalStatus,
          topupTriggered: false,
        };
      }

      await PaymentRepository.mergeWebhookProcessingResult(
        lockedPayment.id,
        PaymentStatus.COMPLETED,
        {
          providerPayload: providerPayment,
          webhookPayload: payload,
        }
      );

      if (this.hasCompletedTopup(lockedPayment.response_payload)) {
        logger.info('Clip topup already processed, skipping duplicate', {
          paymentId: lockedPayment.id.toString(),
          externalTransactionId: lockedPayment.idempotency_key,
        });

        return {
          providerPaymentId,
          paymentId: lockedPayment.id.toString(),
          status: PaymentStatus.COMPLETED,
          topupTriggered: false,
          topupExternalTransactionId: lockedPayment.idempotency_key,
        };
      }

      const topupRequest = buildTopupRequestFromPayment(lockedPayment);

      try {
        const topupResponse = await TopupBackofficeService.topUp(topupRequest);

        await PaymentRepository.mergeWebhookProcessingResult(
          lockedPayment.id,
          PaymentStatus.COMPLETED,
          {
            providerPayload: providerPayment,
            webhookPayload: payload,
            topup: buildTopupPayloadFromRequest(
              topupRequest,
              PaymentStatus.COMPLETED,
              { response: topupResponse }
            ),
          }
        );

        logger.info('Clip webhook topup completed', {
          paymentId: lockedPayment.id.toString(),
          providerPaymentId,
          externalTransactionId: topupRequest.externalTransactionId,
        });

        const linkProofPaymentSent = await sendPaymentProofByEmail(
          PaymentConst.link,
          lockedPayment.Users.email,
          receiptPaymentData,
          [{ type: 'from-email', format: 'image', filename: 'comprobante.png' }]
        );

        logger.debug('Link proof of payment email sent', {
          result: linkProofPaymentSent,
        });

        await NotificationService.sendToUser(Number(lockedPayment.user_id), {
          title: 'Depósito recibido',
          body: `Se acreditaron $${providerPayment.amount} ${providerPayment.currency} a tu cuenta`,
          data: { type: 'clip_topup', paymentId: lockedPayment.id.toString() },
        });

        return {
          providerPaymentId,
          paymentId: lockedPayment.id.toString(),
          status: PaymentStatus.COMPLETED,
          topupTriggered: true,
          topupExternalTransactionId: topupRequest.externalTransactionId,
        };
      } catch (error) {
        if (error instanceof ConflictError) {
          logger.warn('Clip topup reported duplicate/conflict, marking done', {
            paymentId: lockedPayment.id.toString(),
            providerPaymentId,
            externalTransactionId: topupRequest.externalTransactionId,
            message: error.message,
          });

          await PaymentRepository.mergeWebhookProcessingResult(
            lockedPayment.id,
            PaymentStatus.COMPLETED,
            {
              providerPayload: providerPayment,
              webhookPayload: payload,
              topup: buildTopupPayloadFromRequest(
                topupRequest,
                PaymentStatus.COMPLETED,
                { note: 'Topup conflict treated as idempotent duplicate' }
              ),
            }
          );

          return {
            providerPaymentId,
            paymentId: lockedPayment.id.toString(),
            status: PaymentStatus.COMPLETED,
            topupTriggered: false,
            topupExternalTransactionId: topupRequest.externalTransactionId,
          };
        }

        await PaymentRepository.mergeWebhookProcessingResult(
          lockedPayment.id,
          PaymentStatus.COMPLETED,
          {
            providerPayload: providerPayment,
            webhookPayload: payload,
            topup: buildTopupPayloadFromRequest(
              topupRequest,
              PaymentStatus.FAILED,
              {
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unknown topup processing error',
              }
            ),
          }
        );

        logger.error('Clip webhook topup failed', {
          paymentId: lockedPayment.id.toString(),
          providerPaymentId,
          externalTransactionId: topupRequest.externalTransactionId,
          error,
        });

        throw error;
      }
    } finally {
      await PaymentRepository.releasePaymentLock(lockName);
    }
  }

  /**
   * Map Payment Provider API response to client-friendly format
   */
  private static mapToClientResponse(
    payment: PaymentProviderPaymentResponse,
    statusOverride?: PaymentStatus
  ): PaymentServiceClientResponse {
    const paymentMethodCard = {
      lastDigits: payment.payment_method.card.last_digits,
      type: payment.payment_method.type,
      issuer: payment.payment_method.card.issuer,
    };
    const pendingAction = {
      type: payment.pending_action.type,
      url: payment.pending_action.url,
    };
    return {
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: statusOverride ?? mapClipStatusToInternal(payment.status),
      statusMessage: payment.status_detail.message,
      receiptNo: payment.receipt_no,
      approvedAt: payment.approved_at,
      card: payment.payment_method.card ? paymentMethodCard : undefined,
      pendingAction: payment.pending_action ? pendingAction : undefined,
    };
  }

  private static mapClipStatusBeforeWebhook(status?: string): PaymentStatus {
    const finalStatus = mapClipStatusToInternal(status);

    if (finalStatus === PaymentStatus.COMPLETED) {
      return PaymentStatus.PROCESSING;
    }

    return finalStatus;
  }

  private static async getConfirmedProviderPayment(
    providerPaymentId: string,
    _payload: ClipWebhookPayload
  ): Promise<PaymentProviderPaymentResponse> {
    return PaymentProviderService.getPaymentDetails(providerPaymentId);
  }

  private static hasCompletedTopup(responsePayload: unknown): boolean {
    const typedPayload = responsePayload as {
      topup?: PaymentTopupPayload;
    } | null;
    return typedPayload?.topup?.status === PaymentStatus.COMPLETED;
  }
}
