import { BulkBatchRepository } from '../repositories/bulkBatch.repository';
import { BulkOrderCardNotification } from '@/schemas';
import { db } from '@/config/prisma';
import { buildLogger } from '@/utils';

const logger = buildLogger('WebhooksService');

export class WebhooksService {
  static async handleBulkOrderCardNotification(
    data: BulkOrderCardNotification
  ): Promise<void> {
    logger.info('Processing bulk order card notification', { data });

    // Create or update bulk batch record
    await BulkBatchRepository.createBulkBatch(data);

    // If the notification includes card details, update individual cards
    if (data.cards && data.cards.length > 0) {
      logger.info(`Updating ${data.cards.length} cards to DELIVERED state`);
      
      for (const cardData of data.cards) {
        if (cardData.card_id) {
          // Update card with prosperaCardId to mark as DELIVERED
          await db.cards.updateMany({
            where: {
              cardIdentifier: cardData.card_identifier,
            },
            data: {
              prosperaCardId: cardData.card_id.toString(),
              // Keep status as INACTIVE - it will show as DELIVERED because prosperaCardId exists
              updatedAt: new Date(),
            },
          });
          
          logger.info(`Card ${cardData.card_identifier} marked as DELIVERED`);
        }
      }
    }

    logger.info('Bulk order notification processed successfully');
  }
}
