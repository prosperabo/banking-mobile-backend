import { createHash, randomUUID } from 'crypto';
import { ClipWebhookPayload, PaymentStatus } from '@/schemas/payment.schemas';
import { SipCurrency } from '@/schemas/sip.schemas';
import { buildLogger } from '@/utils';
import { config } from '@/config';

const logger = buildLogger('PaymentUtils');

export interface PaymentFeeCalculation {
  businessFeeRate: number;
  businessFeeAmount: number;
  grossAmount: number;
  netAmount: number;
}

/**
 * Calculate payment fees for exchange-rate payments.
 *
 * The incoming `amount` is the net value (the exchange rate was already
 * discounted by `usdMxnFeeRate` before the payment was created).
 * We back-calculate the gross so that:
 *   grossAmount = netAmount / (1 - feeRate)
 *   netAmount   = amount (what arrived in the request)
 */
export function calculatePaymentFees(amount: number): PaymentFeeCalculation {
  const businessFeeRate = config.exchangeRate.usdMxnFeeRate;

  const netAmount = amount;
  const grossAmount = netAmount / (1 - businessFeeRate);
  const businessFeeAmount = grossAmount - netAmount;

  logger.debug('Calculated payment fees', {
    netAmount,
    grossAmount,
    businessFeeRate,
    businessFeeAmount,
  });

  return {
    businessFeeRate,
    businessFeeAmount,
    grossAmount,
    netAmount,
  };
}

/**
 * Generate a unique idempotency key for generic (Clip) payments.
 */
export function generateIdempotencyKey(): string {
  return randomUUID();
}

export function generateRandomUUID(): string {
  return randomUUID();
}

/**
 * Generate a deterministic idempotency key for SIP QR creation.
 *
 * The key is stable within the same UTC minute for identical
 * (userId + amount + currency) combinations, preventing duplicate
 * QR records from retries or double-clicks.
 * Requests in different minutes always produce a different key,
 * so legitimate top-ups are never blocked.
 *
 * Algorithm:
 *   baseString = "SIP_TOPUP|{userId}|{amount_2dp}|{currency}|{YYYYMMDDHHmm_UTC}"
 *   key        = sha256(baseString).hex
 */
export function generateSipQrIdempotencyKey(
  userId: number,
  amount: number,
  currency: SipCurrency
): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const minuteBucket = `${year}${month}${day}${hours}${minutes}`;

  const amountNormalized = amount.toFixed(2);
  const baseString = `SIP_TOPUP|${userId}|${amountNormalized}|${currency}|${minuteBucket}`;

  return createHash('sha256').update(baseString, 'utf8').digest('hex');
}

export function mapClipStatusToInternal(status?: string): PaymentStatus {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'succeeded':
    case 'completed':
      return PaymentStatus.COMPLETED;

    case 'pending':
    case 'in_process':
    case 'authorized':
      return PaymentStatus.PROCESSING;

    case 'rejected':
    case 'failed':
    case 'declined':
      return PaymentStatus.FAILED;

    case 'cancelled':
    case 'canceled':
      return PaymentStatus.CANCELLED;

    default:
      return PaymentStatus.PENDING;
  }
}

export function extractClipWebhookPaymentId(
  payload: ClipWebhookPayload
): string | undefined {
  const candidates = [
    payload.provider_payment_id,
    payload.payment_id,
    payload.resource_id,
    payload.item?.payment_id,
    payload.item?.id,
    payload.data?.payment_id,
    payload.data?.id,
    payload.id,
  ];

  return candidates.find(
    candidate => typeof candidate === 'string' && candidate.trim().length > 0
  );
}

export function extractClipWebhookStatus(
  payload: ClipWebhookPayload
): string | undefined {
  const candidates = [
    payload.status,
    payload.item?.status,
    payload.data?.status,
  ];

  return candidates.find(
    candidate => typeof candidate === 'string' && candidate.trim().length > 0
  );
}

export function buildExpirationDate(daysFromNow = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
