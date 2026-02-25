import { createHash, randomUUID } from 'crypto';
import { PaymentStatus } from '@/schemas/payment.schemas';
import { SipCurrency } from '@/schemas/sip.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('PaymentUtils');

export interface PaymentFeeCalculation {
  businessFeeRate: number;
  businessFeeAmount: number;
  netAmount: number;
}

/**
 * Calculate payment fees: total commission 5%, Clip takes 3%, we take 2%
 */
export function calculatePaymentFees(amount: number): PaymentFeeCalculation {
  const totalCommissionRate = 0.05;
  const businessFeeRate = 0.02;

  const businessFeeAmount = amount * businessFeeRate;
  const netAmount = amount - amount * totalCommissionRate;

  logger.debug('Calculated payment fees', {
    amount,
    businessFeeRate,
    businessFeeAmount,
    netAmount,
  });

  return {
    businessFeeRate,
    businessFeeAmount,
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
      return PaymentStatus.COMPLETED;

    case 'pending':
    case 'in_process':
      return PaymentStatus.PENDING;

    case 'rejected':
    case 'cancelled':
    case 'canceled':
      return PaymentStatus.FAILED;

    default:
      return PaymentStatus.FAILED;
  }
}

export function buildExpirationDate(daysFromNow = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
