import { Prisma } from '@prisma/client';
import { db } from '@/config/prisma';
import {
  RampProvider,
  RampOrderType,
  RampOrderStatus,
  WalletChain,
} from '@prisma/client';
import { buildLogger } from '@/utils';

const logger = buildLogger('RampOrderRepository');

export class RampOrderRepository {
  static async findById(id: number) {
    logger.debug('Finding ramp order by id', { id });
    return db.rampOrder.findUnique({
      where: { id },
    });
  }

  static async findByIdempotencyKey(idempotencyKey: string) {
    logger.debug('Finding ramp order by idempotencyKey', { idempotencyKey });
    return db.rampOrder.findUnique({
      where: { idempotencyKey },
    });
  }

  static async findByProviderOrderId(providerOrderId: string) {
    logger.debug('Finding ramp order by providerOrderId', { providerOrderId });
    return db.rampOrder.findUnique({
      where: { providerOrderId },
    });
  }

  static async findByUserId(userId: number) {
    logger.debug('Finding ramp orders by userId', { userId });
    return db.rampOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data: {
    userId: number;
    walletId?: number | null;
    provider: RampProvider;
    type: RampOrderType;
    providerOrderId?: string | null;
    idempotencyKey: string;
    fiatAmount?: string | null;
    fiatCurrency?: string;
    cryptoAmount?: string | null;
    cryptoAsset?: string | null;
    chain?: WalletChain | null;
    paymentMethod?: string | null;
    bankName?: string | null;
    accountSuffix?: string | null;
    status?: RampOrderStatus;
    failureReason?: string | null;
    requestPayload?: Record<string, unknown> | null;
    responsePayload?: Record<string, unknown> | null;
  }) {
    logger.debug('Creating RampOrder', { userId: data.userId });
    return db.rampOrder.create({
      data: {
        userId: data.userId,
        walletId: data.walletId ?? null,
        provider: data.provider,
        type: data.type,
        providerOrderId: data.providerOrderId ?? null,
        idempotencyKey: data.idempotencyKey,
        fiatAmount: data.fiatAmount ?? null,
        fiatCurrency: data.fiatCurrency ?? 'MXN',
        cryptoAmount: data.cryptoAmount ?? null,
        cryptoAsset: data.cryptoAsset ?? null,
        chain: data.chain ?? null,
        paymentMethod: data.paymentMethod ?? null,
        bankName: data.bankName ?? null,
        accountSuffix: data.accountSuffix ?? null,
        status: data.status ?? 'PENDING',
        failureReason: data.failureReason ?? null,
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
    status: RampOrderStatus,
    failureReason?: string | null
  ) {
    logger.debug('Updating RampOrder status', { id, status });
    return db.rampOrder.update({
      where: { id },
      data: {
        status,
        failureReason: failureReason ?? null,
      },
    });
  }

  static async update(
    id: number,
    data: {
      providerOrderId?: string;
      cryptoAmount?: string;
      cryptoAsset?: string;
      chain?: WalletChain;
      paymentMethod?: string;
      status?: RampOrderStatus;
      failureReason?: string | null;
      responsePayload?: Record<string, unknown> | null;
    }
  ) {
    logger.debug('Updating RampOrder', { id });
    return db.rampOrder.update({
      where: { id },
      data: {
        ...(data.providerOrderId !== undefined
          ? { providerOrderId: data.providerOrderId }
          : {}),
        ...(data.cryptoAmount !== undefined
          ? { cryptoAmount: data.cryptoAmount }
          : {}),
        ...(data.cryptoAsset !== undefined
          ? { cryptoAsset: data.cryptoAsset }
          : {}),
        ...(data.chain !== undefined ? { chain: data.chain } : {}),
        ...(data.paymentMethod !== undefined
          ? { paymentMethod: data.paymentMethod }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.failureReason !== undefined
          ? { failureReason: data.failureReason }
          : {}),
        ...(data.responsePayload !== undefined
          ? { responsePayload: data.responsePayload as Prisma.InputJsonValue }
          : {}),
      },
    });
  }
}
