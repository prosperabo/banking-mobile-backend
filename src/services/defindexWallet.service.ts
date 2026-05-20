import {
  DefindexWallet_chainType,
  DefindexWallet_status,
} from '@prisma/client';
import { DefindexWalletRepository } from '@/repositories/defindexWallet.repository';
import crossmintInstance from '@/api/crossmint.instance';
import { buildLogger } from '@/utils';
import { NotFoundError } from '@/shared/errors';
import {
  CrossmintCreateWalletRequest,
  CrossmintWalletResponse,
  WalletResponse,
} from '@/schemas/defindex.schemas';

const logger = buildLogger('DefindexWalletService');

export class DefindexWalletService {
  static async createOrGetWallet(userId: number): Promise<WalletResponse> {
    logger.info('createOrGetWallet called', { userId });

    const existing = await DefindexWalletRepository.findByUserId(userId);
    if (existing) {
      logger.info('Wallet already exists, returning existing', { userId });
      return existing;
    }

    const payload: CrossmintCreateWalletRequest = {
      type: 'stellar-mpc-wallet:non-custodial',
      linkedUser: `userId:${userId}`,
    };

    const { data } = await crossmintInstance.post<CrossmintWalletResponse>(
      '/api/2022-06-09/wallets',
      payload
    );

    logger.info('Crossmint wallet created', {
      userId,
      crossmintWalletId: data.id,
      walletAddress: data.address,
    });

    const wallet = await DefindexWalletRepository.create({
      userId,
      crossmintWalletId: data.id,
      walletAddress: data.address,
      chainType: DefindexWallet_chainType.STELLAR,
      status: DefindexWallet_status.ACTIVE,
    });

    return wallet;
  }

  static async getWalletByUser(userId: number): Promise<WalletResponse> {
    logger.info('getWalletByUser called', { userId });

    const wallet = await DefindexWalletRepository.findByUserId(userId);
    if (!wallet) throw new NotFoundError('Wallet not found for this user.');

    return wallet;
  }
}
