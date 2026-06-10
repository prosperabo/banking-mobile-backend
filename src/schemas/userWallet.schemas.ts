import {
  WalletProvider,
  WalletChain,
  CustodyType,
  WalletStatus,
} from '@prisma/client';

export { WalletProvider, WalletChain, CustodyType, WalletStatus };

export interface UserWalletResponse {
  id: number;
  userId: number;
  provider: WalletProvider;
  providerWalletId: string;
  walletAddress: string;
  chain: WalletChain;
  custodyType: CustodyType;
  status: WalletStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrossmintCreateWalletRequest {
  type: string;
  linkedUser: string;
}

export interface CrossmintWalletResponse {
  id: string;
  type: string;
  address: string;
  linkedUser: string;
}
