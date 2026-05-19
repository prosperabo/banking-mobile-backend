import { DefindexWallet_chainType, DefindexWallet_status } from '@prisma/client';

export { DefindexWallet_chainType as WalletChainType, DefindexWallet_status as WalletStatus };

export interface WalletResponse {
  id: number;
  userId: number;
  crossmintWalletId: string;
  walletAddress: string;
  chainType: DefindexWallet_chainType;
  status: DefindexWallet_status;
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
