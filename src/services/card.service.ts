import { CardRepository } from '@/repositories/card.repository';
import { formatMaskedNumber } from '@/utils/card.utils';
import { ActivateCardResponse } from '@/schemas/card.schemas';
import { buildLogger } from '@/utils';
import { CardBackofficeService } from '@/services/card.backoffice.service';

const logger = buildLogger('CardService');

export class CardService {
  static async getUserCards(userId: number) {
    logger.info(`Fetching cards for user ${userId}`);
    const cards = await CardRepository.getUserCards(userId);

    return cards.map(card => ({
      ...card,
      maskedNumber: formatMaskedNumber(card.maskedNumber || ''),
    }));
  }

  static async activateCard(
    cardId: number,
    pin: string,
    customerToken: string,
    customerId: number
  ): Promise<ActivateCardResponse> {
    logger.info(`Activating card ${cardId}`);
    const card = await CardRepository.getCardById(cardId);

    if (!card) {
      logger.error(`Card ${cardId} not found`);
      throw new Error('Card not found');
    }

    const activatedResponse = await CardBackofficeService.activateCard(
      {
        card_identifier: card.cardIdentifier,
        reference_batch: card.BulkBatch!.referenceBatch,
        pin,
        customer_id: customerId.toString(),
      },
      customerToken
    );

    logger.info(`Card ${cardId} activated successfully`);

    const cardResponse = await CardBackofficeService.getCardInfo(
      customerId,
      customerToken,
      activatedResponse.payload.card_id
    );

    const cardNumber = formatMaskedNumber(
      cardResponse.payload.cards[0].card_number || '',
      false
    );

    await CardRepository.updateCard(cardId, {
      prosperaCardId: activatedResponse.payload.card_id.toString(),
      status: 'ACTIVE',
      maskedNumber: cardNumber,
    });

    return activatedResponse;
  }

  static async getCardInfo(cardId: number) {
    logger.info(`Fetching info for card ${cardId}`);
    const card = await CardRepository.getCardById(cardId);

    if (!card) {
      logger.error(`Card ${cardId} not found`);
      throw new Error('Card not found');
    }

    return card;
  }

  static async getCardDetailsById(
    cardId: number,
    customerToken: string,
    customerId: number
  ) {
    logger.info(`Fetching card details for cardId: ${cardId}`);

    const card = await CardRepository.getCardById(cardId);

    if (!card || !card.prosperaCardId) {
      logger.error(
        `Card with ID ${cardId} not found or missing prosperaCardId`
      );
      throw new Error('Card not found or invalid prosperaCardId');
    }

    logger.info(`Found card with prosperaCardId: ${card.prosperaCardId}`);

    const cardInfo = await CardBackofficeService.getCardInfo(
      customerId,
      customerToken,
      Number(card.prosperaCardId)
    );

    logger.info('Card info fetched successfully from backoffice', { cardInfo });

    return cardInfo.payload.cards[0];
  }
}
