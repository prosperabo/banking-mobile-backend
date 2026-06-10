import {
  InvestmentProvider,
  InvestmentOperationType,
  InvestmentOperationStatus,
  WalletChain,
} from '@prisma/client';

export {
  InvestmentProvider,
  InvestmentOperationType,
  InvestmentOperationStatus,
  WalletChain,
};

export interface InvestmentOperationResponse {
  id: number;
  userId: number;
  walletId: number;
  provider: InvestmentProvider;
  type: InvestmentOperationType;
  externalProductId: string | null;
  externalOperationId: string | null;
  asset: string;
  amount: string;
  chain: WalletChain;
  status: InvestmentOperationStatus;
  txHash: string | null;
  providerTxId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvestmentOperationInput {
  userId: number;
  walletId: number;
  provider: InvestmentProvider;
  type: InvestmentOperationType;
  externalProductId?: string | null;
  externalOperationId?: string | null;
  asset: string;
  amount: string;
  chain: WalletChain;
  txHash?: string | null;
  providerTxId?: string | null;
  requestPayload?: Record<string, unknown> | null;
  responsePayload?: Record<string, unknown> | null;
}
