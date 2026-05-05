import type { payments as PaymentModel } from '@prisma/client';
import {
  WalletTopUpRequest,
  PaymentTopupPayload,
  PaymentStatus,
} from '@/schemas/payment.schemas';
import { BadRequestError } from '@/shared/errors';

/**
 * Build a Backoffice wallet topup request from a payment record.
 * Expects the payment to include `Users.BackofficeAuthState`.
 */
export function buildTopupRequestFromPayment(
  payment: PaymentModel & {
    Users?: {
      BackofficeAuthState?: {
        ewalletId: number | null;
        externalCustomerId: number | null;
      } | null;
    };
  }
): WalletTopUpRequest {
  const authState = payment.Users?.BackofficeAuthState;

  if (!authState?.ewalletId || !authState.externalCustomerId) {
    throw new BadRequestError('User backoffice data is incomplete for topup');
  }

  const amountDecimal = payment.net_amount_mxn ?? payment.net_amount;

  return {
    externalTransactionId: payment.idempotency_key,
    balanceId: authState.ewalletId,
    amount: amountDecimal.toNumber(),
    sourceCustomerID: authState.externalCustomerId,
    transactionType: 1 as const,
  };
}

export function buildTopupPayloadFromRequest(
  topupRequest: WalletTopUpRequest,
  status: PaymentStatus,
  extras?: Pick<PaymentTopupPayload, 'response' | 'note' | 'error'>
): PaymentTopupPayload {
  return {
    status,
    externalTransactionId: topupRequest.externalTransactionId,
    amount: topupRequest.amount,
    balanceId: topupRequest.balanceId,
    sourceCustomerID: topupRequest.sourceCustomerID,
    ...extras,
  };
}
