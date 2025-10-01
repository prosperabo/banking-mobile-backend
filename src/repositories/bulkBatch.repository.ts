import { db } from '@/config/prisma';
import { BulkOrderCardNotification } from '@/schemas';

export class BulkBatchRepository {
  static async createBulkBatch(data: BulkOrderCardNotification): Promise<void> {
    await db.bulkBatch.create({
      data: {
        referenceBatch: data.referenceBatch,
        status: data.status,
        numCreated: data.numCreated,
        numFailed: data.numFailed,
        requestedAt: new Date(),
      },
    });
  }
}
