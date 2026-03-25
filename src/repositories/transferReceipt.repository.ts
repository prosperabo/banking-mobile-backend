import { TransferReceiptType } from '@prisma/client';

import { db } from '@/config/prisma';
import type {
  TransferReceipt,
  TransferReceiptCreate,
} from '@/schemas/repository.schemas';

export class TransferReceiptRepository {
  static async create(data: {
    userId: number;
    type: TransferReceiptType;
    transferData: TransferReceiptCreate['transferData'];
  }): Promise<TransferReceipt> {
    return db.transferReceipt.create({
      data: {
        userId: data.userId,
        type: data.type,
        transferData: data.transferData,
      },
    });
  }
}
