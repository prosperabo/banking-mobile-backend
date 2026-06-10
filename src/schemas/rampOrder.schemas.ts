import {
  RampProvider,
  RampOrderType,
  RampOrderStatus,
  WalletChain,
} from '@prisma/client';

export { RampProvider, RampOrderType, RampOrderStatus, WalletChain };

export interface RampOrderResponse {
  id: number;
  userId: number;
  walletId: number | null;
  provider: RampProvider;
  type: RampOrderType;
  providerOrderId: string | null;
  idempotencyKey: string;
  fiatAmount: string | null;
  fiatCurrency: string;
  cryptoAmount: string | null;
  cryptoAsset: string | null;
  chain: WalletChain | null;
  paymentMethod: string | null;
  bankName: string | null;
  accountSuffix: string | null;
  status: RampOrderStatus;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRampOrderInput {
  userId: number;
  walletId?: number | null;
  provider: RampProvider;
  type: RampOrderType;
  idempotencyKey: string;
  fiatAmount?: string | null;
  fiatCurrency?: string;
  cryptoAmount?: string | null;
  cryptoAsset?: string | null;
  chain?: WalletChain | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  accountSuffix?: string | null;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
}
