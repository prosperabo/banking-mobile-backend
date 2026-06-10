import { Prisma } from '@prisma/client';
import { db } from '@/config/prisma';
import {
  InvestmentProvider,
  InvestmentOperationType,
  InvestmentOperationStatus,
  WalletChain,
} from '@prisma/client';
import { buildLogger } from '@/utils';

const logger = buildLogger('InvestmentOperationRepository');

export class InvestmentOperationRepository {
  static async findById(id: number) {
    logger.debug('Finding investment operation by id', { id });
    return db.investmentOperation.findUnique({
      where: { id },
    });
  }

  static async findByUserId(userId: number) {
    logger.debug('Finding investment operations by userId', { userId });
    return db.investmentOperation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByTxHash(txHash: string) {
    logger.debug('Finding investment operation by txHash', { txHash });
    return db.investmentOperation.findFirst({
      where: { txHash },
    });
  }

  static async create(data: {
    userId: number;
    walletId: number;
    provider: InvestmentProvider;
    type: InvestmentOperationType;
    externalProductId?: string | null;
    externalOperationId?: string | null;
    asset: string;
    amount: string;
    chain: WalletChain;
    status?: InvestmentOperationStatus;
    txHash?: string | null;
    providerTxId?: string | null;
    requestPayload?: Record<string, unknown> | null;
    responsePayload?: Record<string, unknown> | null;
  }) {
    logger.debug('Creating InvestmentOperation', { userId: data.userId });
    return db.investmentOperation.create({
      data: {
        userId: data.userId,
        walletId: data.walletId,
        provider: data.provider,
        type: data.type,
        externalProductId: data.externalProductId ?? null,
        externalOperationId: data.externalOperationId ?? null,
        asset: data.asset,
        amount: data.amount,
        chain: data.chain,
        status: data.status ?? 'PENDING',
        txHash: data.txHash ?? null,
        providerTxId: data.providerTxId ?? null,
        requestPayload: (data.requestPayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        responsePayload: (data.responsePayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }

  static async updateStatus(
    id: number,
    status: InvestmentOperationStatus,
    failureReason?: string | null
  ) {
    logger.debug('Updating InvestmentOperation status', { id, status });
    return db.investmentOperation.update({
      where: { id },
      data: {
        status,
        failureReason: failureReason ?? null,
      },
    });
  }

  static async attachTransactionResult(
    id: number,
    data: {
      txHash: string;
      providerTxId?: string | null;
      status: InvestmentOperationStatus;
      responsePayload?: Record<string, unknown> | null;
    }
  ) {
    logger.debug('Attaching transaction result to InvestmentOperation', {
      id,
    });
    return db.investmentOperation.update({
      where: { id },
      data: {
        txHash: data.txHash,
        providerTxId: data.providerTxId ?? null,
        status: data.status,
        responsePayload: (data.responsePayload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
  }
}
