import { WalletChain, WalletStatus } from '@prisma/client';

export { WalletChain as WalletChainType, WalletStatus };

export interface WalletResponse {
  id: number;
  userId: number;
  crossmintWalletId: string;
  walletAddress: string;
  chainType: WalletChain;
  status: WalletStatus;
  createdAt: Date;
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
