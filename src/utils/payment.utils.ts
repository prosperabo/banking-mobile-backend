import { buildLogger } from '@/utils';
import { randomUUID } from 'crypto';

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
 * Generate a unique idempotency key for payment
 */
export function generateIdempotencyKey(): string {
  return randomUUID();
}
