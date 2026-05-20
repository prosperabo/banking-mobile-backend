import type { payments as PaymentModel } from '@prisma/client';
import {
  WalletTopUpRequest,
  PaymentTopupPayload,
  PaymentStatus,
} from '@/schemas/payment.schemas';
import { BadRequestError } from '@/shared/errors';
import { buildLogger } from './logger';

const logger = buildLogger('TopupUtils');

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
      BackofficeCustomerProfile?: {
        ewallet_id: number | null;
        external_customer_id: number | null;
      } | null;
    };
  }
): WalletTopUpRequest {
  const authState = payment.Users!.BackofficeAuthState;
  const profile = payment.Users!.BackofficeCustomerProfile;
  const ewalletId = authState!.ewalletId ?? profile!.ewallet_id;
  const externalCustomerId =
    authState!.externalCustomerId ?? profile!.external_customer_id;

  logger.info('Building topup request from payment', {
    paymentId: payment.id.toString(),
    ewalletId,
    externalCustomerId,
  });

  if (!ewalletId || !externalCustomerId) {
    throw new BadRequestError('User backoffice data is incomplete for topup');
  }

  const amountDecimal = payment.net_amount_mxn ?? payment.net_amount;

  return {
    externalTransactionId: payment.idempotency_key,
    balanceId: ewalletId,
    amount: amountDecimal.toNumber(),
    sourceCustomerID: externalCustomerId,
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
