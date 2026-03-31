import { BulkBatchRepository } from '../repositories/bulkBatch.repository';
import { CardRepository } from '@/repositories/card.repository';
import { BulkOrderCardNotification } from '@/schemas';
import {
  ClipWebhookPayload,
  ClipWebhookProcessResponse,
} from '@/schemas/payment.schemas';
import { PaymentService } from './payment.service';
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
      logger.info(`Updating ${data.cards.length} cards with prosperaCardId`);

      for (const cardData of data.cards) {
        if (cardData.card_id) {
          // Update card with prosperaCardId
          await CardRepository.updateCardByIdentifier(
            cardData.card_identifier,
            {
              prosperaCardId: cardData.card_id.toString(),
              // Keep status as INACTIVE
            }
          );

          logger.info(
            `Card ${cardData.card_identifier} updated with prosperaCardId`
          );
        }
      }
    }

    logger.info('Bulk order notification processed successfully');
  }

  static async handleClipPaymentWebhook(
    data: ClipWebhookPayload
  ): Promise<ClipWebhookProcessResponse> {
    logger.info('Processing Clip payment webhook', { data });

    const result = await PaymentService.handleClipWebhook(data);

    logger.info('Clip payment webhook processed successfully', { result });

    return result;
  }
}
