import {
  WalletProvider,
  WalletChain,
  CustodyType,
  WalletStatus,
} from '@prisma/client';
import { UserWalletRepository } from '@/repositories/userWallet.repository';
import { CrossmintWalletClient } from '@/services/crossmintWallet.client';
import { buildLogger } from '@/utils';
import { NotFoundError } from '@/shared/errors';
import {
  WalletResponse,
} from '@/schemas/defindex.schemas';

const logger = buildLogger('UserWalletService');

export class UserWalletService {
  static async createOrGetWallet(userId: number): Promise<WalletResponse> {
    logger.info('createOrGetWallet called', { userId });

    const existing = await UserWalletRepository.findByUserId(userId);
    if (existing) {
      logger.info('Wallet already exists, returning existing', { userId });
      return UserWalletService.toWalletResponse(existing);
    }

    const { id, address } = await CrossmintWalletClient.createWallet(userId);

    const wallet = await UserWalletRepository.create({
      userId,
      provider: WalletProvider.CROSSMINT,
      providerWalletId: id,
      walletAddress: address,
      chain: WalletChain.STELLAR,
      custodyType: CustodyType.NON_CUSTODIAL,
      status: WalletStatus.ACTIVE,
    });

    return UserWalletService.toWalletResponse(wallet);
  }

  static async getWalletByUser(userId: number): Promise<WalletResponse> {
    logger.info('getWalletByUser called', { userId });

    const wallet = await UserWalletRepository.findByUserId(userId);
    if (!wallet) throw new NotFoundError('Wallet not found for this user.');

    return UserWalletService.toWalletResponse(wallet);
  }

  private static toWalletResponse(
    wallet: Record<string, unknown> & {
      id: number;
      userId: number;
      providerWalletId: string;
      walletAddress: string;
      chain: WalletChain;
      status: WalletStatus;
      createdAt: Date;
    }
  ): WalletResponse {
    return {
      id: wallet.id,
      userId: wallet.userId,
      crossmintWalletId: wallet.providerWalletId,
      walletAddress: wallet.walletAddress,
      chainType: wallet.chain,
      status: wallet.status,
      createdAt: wallet.createdAt,
    };
  }
}
