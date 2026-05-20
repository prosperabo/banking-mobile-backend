import { db } from '@/config/prisma';
import {
  DefindexWallet_chainType,
  DefindexWallet_status,
} from '@prisma/client';
import { buildLogger } from '@/utils';

const logger = buildLogger('DefindexWalletRepository');

export class DefindexWalletRepository {
  static async findByUserId(userId: number) {
    logger.debug('Finding wallet by userId', { userId });
    return db.defindexWallet.findUnique({
      where: { userId },
    });
  }

  static async create(data: {
    userId: number;
    crossmintWalletId: string;
    walletAddress: string;
    chainType: DefindexWallet_chainType;
    status: DefindexWallet_status;
  }) {
    logger.debug('Creating DefindexWallet', { userId: data.userId });
    return db.defindexWallet.create({
      data: {
        userId: data.userId,
        crossmintWalletId: data.crossmintWalletId,
        walletAddress: data.walletAddress,
        chainType: data.chainType,
        status: data.status,
        updatedAt: new Date(),
      },
    });
  }
}
