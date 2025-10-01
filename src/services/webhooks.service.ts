import { BulkBatchRepository } from '../repositories/bulkBatch.repository';
import { BulkOrderCardNotification } from '@/schemas';

export class WebhooksService {
  static async handleBulkOrderCardNotification(
    data: BulkOrderCardNotification
  ): Promise<void> {
    await BulkBatchRepository.createBulkBatch(data);
  }
}
