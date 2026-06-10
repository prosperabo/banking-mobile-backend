import { Prisma } from '@prisma/client';
import { db } from '@/config/prisma';
import {
  WalletProvider,
  WalletChain,
  CustodyType,
  WalletStatus,
} from '@prisma/client';
import { buildLogger } from '@/utils';

const logger = buildLogger('UserWalletRepository');

export class UserWalletRepository {
  static async findByUserId(userId: number) {
    logger.debug('Finding wallet by userId', { userId });
    return db.userWallet.findUnique({
      where: { userId },
    });
  }

  static async findById(id: number) {
    logger.debug('Finding wallet by id', { id });
    return db.userWallet.findUnique({
      where: { id },
    });
  }

  static async create(data: {
    userId: number;
    provider: WalletProvider;
    providerWalletId: string;
    walletAddress: string;
    chain: WalletChain;
    custodyType: CustodyType;
    status: WalletStatus;
    metadata?: Record<string, unknown> | null;
  }) {
    logger.debug('Creating UserWallet', { userId: data.userId });
    return db.userWallet.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        providerWalletId: data.providerWalletId,
        walletAddress: data.walletAddress,
        chain: data.chain,
        custodyType: data.custodyType,
        status: data.status,
        metadata: (data.metadata ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  static async updateByUserId(
    userId: number,
    data: {
      provider?: WalletProvider;
      providerWalletId?: string;
      walletAddress?: string;
      chain?: WalletChain;
      custodyType?: CustodyType;
      status?: WalletStatus;
      metadata?: Record<string, unknown> | null;
    }
  ) {
    logger.debug('Updating UserWallet by userId', { userId });
    return db.userWallet.update({
      where: { userId },
      data: {
        ...(data.provider !== undefined ? { provider: data.provider } : {}),
        ...(data.providerWalletId !== undefined
          ? { providerWalletId: data.providerWalletId }
          : {}),
        ...(data.walletAddress !== undefined
          ? { walletAddress: data.walletAddress }
          : {}),
        ...(data.chain !== undefined ? { chain: data.chain } : {}),
        ...(data.custodyType !== undefined
          ? { custodyType: data.custodyType }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.metadata !== undefined
          ? { metadata: data.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  }
}
