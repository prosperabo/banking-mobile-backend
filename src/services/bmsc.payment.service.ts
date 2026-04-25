import { BmscPaymentRepository } from '@/repositories/bmsc.payment.repository';
import { SipBmscService } from '@/services/sip.bmsc.service';
import { config } from '@/config';
import { buildLogger, paymentUtils } from '@/utils';
import {
  CreateSipQrRequestDto,
  CreateSipQrResponseDto,
  SipGenerateQrRequestDto,
  SipCallbackDto,
  SipAckResponse,
  SIP_PROVIDER,
} from '@/schemas/sip.schemas';
import { BadRequestError, NotFoundError } from '@/shared/errors';
import { NotificationService } from './notification.service';

const logger = buildLogger('BmscPaymentService');

export class BmscPaymentService {
  // ─── Create QR ──────────────────────────────────────────────────

  static async createSipQr(
    userId: number,
    sipQrRequest: CreateSipQrRequestDto
  ): Promise<CreateSipQrResponseDto> {
    // 1. Generate deterministic idempotency key (1-minute UTC window)
    const idempotencyKey = paymentUtils.generateSipQrIdempotencyKey(
      userId,
      sipQrRequest.amount,
      sipQrRequest.currency
    );

    logger.info('BmscPaymentService.createSipQr', {
      userId,
      idempotencyKeyPrefix: idempotencyKey.slice(0, 8),
    });

    // 2. Idempotency: return existing record if key already used
    const existing =
      await BmscPaymentRepository.findByIdempotencyKey(idempotencyKey);

    if (existing) {
      logger.info('Idempotent QR request - returning cached record', {
        idempotencyKeyPrefix: idempotencyKey.slice(0, 8),
      });

      const responsePayload = existing.response_payload as Record<
        string,
        unknown
      > | null;

      return {
        paymentId: existing.id.toString(),
        orderId: existing.order_id ?? '',
        // Field names are SIP contract — kept in Spanish as per SIP documentation
        qrBase64: (responsePayload?.imagenQr as string | undefined) ?? '',
        expiresAt:
          (responsePayload?.fechaVencimiento as string | undefined) ?? '',
        sip: {
          idQr: existing.provider_payment_id ?? undefined,
          idTransaccion: responsePayload?.idTransaccion as number | undefined,
          bancoDestino: responsePayload?.bancoDestino as string | undefined,
          cuentaDestino: responsePayload?.cuentaDestino as string | undefined,
        },
      };
    }

    // 2. Build internal alias (orderId)
    const orderId = paymentUtils.generateRandomUUID();

    const glosa = (sipQrRequest.description ?? 'Compra USDT').slice(0, 30);

    const fechaVencimiento = paymentUtils.buildExpirationDate(1);

    const sipRequest: SipGenerateQrRequestDto = {
      alias: orderId,
      callback: config.sip.publicCallbackUrl,
      detalleGlosa: glosa,
      monto: sipQrRequest.amount,
      moneda: sipQrRequest.currency,
      fechaVencimiento,
      tipoSolicitud: 'API',
      unicoUso: 'true',
    };

    // 3. Persist initial PROCESSING record before hitting SIP
    const payment = await BmscPaymentRepository.createSipPayment({
      userId,
      orderId,
      amount: sipQrRequest.amount,
      currency: sipQrRequest.currency,
      description: sipQrRequest.description ?? 'USDT Purchase',
      idempotencyKey,
      requestPayload: sipRequest,
    });

    // 4. Call SIP to generate QR — delegates to SipBmscService (token lifecycle + HTTP)
    const qrObj = await SipBmscService.generateQr(sipRequest);

    // 6. Persist SIP response (idQr, imagenQr, etc.)
    await BmscPaymentRepository.saveSipQrResponse({
      paymentId: payment.id,
      idQr: qrObj.idQr,
      sipResponsePayload: qrObj,
    });

    logger.info('SIP QR created successfully', {
      orderId,
      idQr: qrObj.idQr,
    });

    return {
      paymentId: payment.id.toString(),
      orderId,
      qrBase64: qrObj.imagenQr,
      expiresAt: qrObj.fechaVencimiento,
      sip: {
        idQr: qrObj.idQr,
        idTransaccion: qrObj.idTransaccion,
        bancoDestino: qrObj.bancoDestino,
        cuentaDestino: qrObj.cuentaDestino,
      },
    };
  }

  // ─── Handle Callback ────────────────────────────────────────────

  static async handleSipCallback(dto: SipCallbackDto): Promise<SipAckResponse> {
    const { alias } = dto;

    logger.info('Processing SIP callback', { alias });

    // 1. Find payment by alias (order_id)
    const payment = await BmscPaymentRepository.findByOrderId(alias);

    if (!payment) {
      logger.warn('SIP callback: payment not found', { alias });
      throw new NotFoundError(`Payment not found for alias: ${alias}`);
    }

    // 2. Idempotency — payment already completed, acknowledge without re-processing
    if (payment.status === 'COMPLETED') {
      logger.info('SIP callback already processed — returning ACK', { alias });
      return { codigo: '0000', mensaje: 'Registro Exitoso' };
    }

    // 3. Validate amount and currency when provided by SIP
    if (dto.monto !== undefined) {
      const expected = payment.amount.toNumber();
      const received = Number(dto.monto);

      if (Math.abs(expected - received) > 0.01) {
        logger.error('SIP callback: amount mismatch', {
          alias,
          expected,
          received,
        });
        await BmscPaymentRepository.markFailed(payment.id, {
          reason: 'amount_mismatch',
          expected,
          received,
        });
        throw new BadRequestError(
          `Amount mismatch. Expected: ${expected}, received: ${received}`
        );
      }
    }

    if (dto.moneda !== undefined && dto.moneda !== payment.currency) {
      logger.error('SIP callback: currency mismatch', {
        alias,
        expected: payment.currency,
        received: dto.moneda,
      });
      await BmscPaymentRepository.markFailed(payment.id, {
        reason: 'currency_mismatch',
        expected: payment.currency,
        received: dto.moneda,
      });
      throw new BadRequestError(
        `Currency mismatch. Expected: ${payment.currency}, received: ${dto.moneda}`
      );
    }

    // 4. Mark COMPLETED
    await BmscPaymentRepository.completeSipPayment({
      paymentId: payment.id,
      callbackPayload: dto,
    });

    // 5. TOPUP – create transaction idempotently
    const topupRef = `${SIP_PROVIDER}-${alias}`;

    await BmscPaymentRepository.createTopupIfNotExists(
      payment.user_id,
      payment.amount,
      topupRef,
      'SIP QR TOPUP'
    );

    logger.info('SIP callback processed — TOPUP transaction created', {
      alias,
      topupRef,
    });

    await NotificationService.sendToUser(payment.user_id, {
      title: 'Depósito recibido',
      body: `Se acreditaron ${payment.amount.toNumber()} ${payment.currency} a tu cuenta`,
      data: { type: 'sip_topup', orderId: alias },
    });

    return { codigo: '0000', mensaje: 'Registro Exitoso' };
  }
}
