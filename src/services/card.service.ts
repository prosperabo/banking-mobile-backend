import { CardRepository } from '@/repositories/card.repository';
import {
  formatMaskedNumber,
  generateVirtualCardIdentifier,
} from '@/utils/card.utils';
import { ActivateCardResponse } from '@/schemas/card.schemas';
import { buildLogger } from '@/utils';
import { CardBackofficeService } from '@/services/card.backoffice.service';
import {
  CreateLinkedCardResponsePayload,
  StopCardResponsePayload,
  UnstopCardResponsePayload,
  UserCardInfoResponse,
} from '@/schemas/card.schemas';
import { BackofficeRepository } from '@/repositories/backoffice.repository';

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

    const backofficeProfile = await BackofficeRepository.findProfileByUserId(
      card.userId
    );

    if (!backofficeProfile || !backofficeProfile.ewallet_id) {
      logger.error(`No ewallet_id found for user ${card.userId}`);
      throw new Error('User ewallet not found');
    }

    const activatedResponse = await CardBackofficeService.activateCard(
      {
        card_identifier: card.cardIdentifier,
        reference_batch: card.BulkBatch!.referenceBatch,
        pin,
        customer_id: customerId.toString(),
        balance: {
          id: backofficeProfile.ewallet_id,
        },
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

    logger.info('Card info fetched successfully from backoffice', {
      cardInfo,
      hasPayload: !!cardInfo?.payload,
      hasCards: !!cardInfo?.payload?.cards,
      cardsLength: cardInfo?.payload?.cards?.length,
    });

    if (!cardInfo || !cardInfo.payload) {
      logger.error('Invalid card info response: missing payload', { cardInfo });
      throw new Error('Invalid response from card service: missing payload');
    }

    if (
      !cardInfo.payload.cards ||
      !Array.isArray(cardInfo.payload.cards) ||
      cardInfo.payload.cards.length === 0
    ) {
      logger.error('Invalid card info response: no cards found in payload', {
        payload: cardInfo.payload,
        cardsType: typeof cardInfo.payload.cards,
        cardsIsArray: Array.isArray(cardInfo.payload.cards),
      });
      throw new Error('No card information found in response');
    }

    return cardInfo.payload.cards[0];
  }

  static async stopCard(
    cardId: number,
    customerToken: string,
    customerId: number,
    note = 'Card stopped'
  ): Promise<StopCardResponsePayload> {
    logger.info(`Stopping card ${cardId} for customer ${customerId}`);

    const card = await CardRepository.getCardById(cardId);
    if (!card?.prosperaCardId) {
      throw new Error('Card not found or missing prosperaCardId');
    }

    logger.info(
      `Proceeding directly to stop for card ${cardId} with prosperaCardId: ${card.prosperaCardId}`
    );

    const stopResponse = await CardBackofficeService.stopCard(
      {
        card_id: Number(card.prosperaCardId),
        customer_id: customerId,
        new_card_status: 3,
        note,
      },
      customerToken
    );

    await CardRepository.updateCard(cardId, { status: 'BLOCKED' });

    logger.info(`Card ${cardId} stopped successfully`);
    return {
      ...stopResponse.payload,
    };
  }

  static async unstopCard(
    cardId: number,
    customerToken: string,
    customerId: number,
    note = 'Card unblocked'
  ): Promise<Omit<UnstopCardResponsePayload, 'message'>> {
    logger.info(`Unstopping card ${cardId} for customer ${customerId}`);

    const card = await CardRepository.getCardById(cardId);
    if (!card?.prosperaCardId) {
      logger.error(
        `Card ${cardId} not found in database or missing prosperaCardId`
      );
      throw new Error('Card not found or missing prosperaCardId');
    }

    logger.info(
      `Found card in database with prosperaCardId: ${card.prosperaCardId}`
    );

    logger.info(
      `Skipping validation and proceeding directly to unstop for card ${cardId}`
    );

    const unstopResponse = await CardBackofficeService.unstopCard(
      {
        customer_id: customerId,
        card_id: Number(card.prosperaCardId),
        note,
      },
      customerToken
    );

    await CardRepository.updateCard(cardId, { status: 'ACTIVE' });

    logger.info(`Card ${cardId} unstopped successfully`);
    return {
      card_id: unstopResponse.payload.card_id,
      status: unstopResponse.payload.status,
    };
  }

  static async getUserCardDebitInfo(
    userId: number,
    customerToken: string,
    customerId: number,
    cardPrimaryId?: number
  ): Promise<UserCardInfoResponse> {
    logger.info(`Fetching card info for user ${userId}`);

    const userCards = await CardRepository.getUserCards(userId);
    const activeCard = userCards.find(card => card.status === 'ACTIVE');

    if (!activeCard || !activeCard.prosperaCardId) {
      logger.error(`No active card found for user ${userId}`);
      throw new Error('No active card found');
    }

    const card = cardPrimaryId
      ? await CardRepository.getCardById(cardPrimaryId)
      : undefined;

    const resolvedBackofficeCardId = card?.prosperaCardId
      ? Number(card.prosperaCardId)
      : undefined;

    const cardInfoResponse = await CardBackofficeService.getCardFullInfo(
      customerId,
      customerToken,
      resolvedBackofficeCardId
    );

    if (
      !cardInfoResponse.payload.cards ||
      cardInfoResponse.payload.cards.length === 0
    ) {
      logger.error(`No card info returned for user ${userId}`);
      throw new Error('Card information not found');
    }

    const cardInfo = cardInfoResponse.payload.cards[0];

    const totalLimit = parseFloat(cardInfo.credit_limit);
    const currentBalance = parseFloat(cardInfo.current_balance);
    const usedLimit = totalLimit - currentBalance;

    const now = new Date();
    const cutoffDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      cardInfo.original_billing_day
    );

    return {
      totalLimit: totalLimit,
      usedLimit: usedLimit,
      availableBalance: currentBalance,
      cutoffDate: cutoffDate.toISOString().split('T')[0],
      paymentDueDate: cardInfo.duedate,
    };
  }

  static async createVirtualCard(
    userId: number,
    customerToken: string,
    customerId: number,
    campaignId?: string
  ): Promise<CreateLinkedCardResponsePayload> {
    logger.info(`Creating virtual card for user ${userId}`);

    const backofficeProfile =
      await BackofficeRepository.findProfileByUserId(userId);

    if (!backofficeProfile || !backofficeProfile.ewallet_id) {
      logger.error(`No ewallet_id found for user ${userId}`);
      throw new Error('User ewallet not found');
    }

    const virtualCardResponse = await CardBackofficeService.createLinkedCard(
      {
        campaign_id: campaignId,
        balance_id: backofficeProfile.ewallet_id,
      },
      customerToken
    );

    const cardIdentifier = generateVirtualCardIdentifier(userId);

    await CardRepository.createCard({
      userId,
      cardIdentifier,
      cardType: 'VIRTUAL',
      prosperaCardId: virtualCardResponse.payload.card_id.toString(),
      status: 'ACTIVE',
      maskedNumber: formatMaskedNumber(virtualCardResponse.payload.card_number),
      expiryDate: virtualCardResponse.payload.valid_date,
    });

    logger.info(`Virtual card created successfully for user ${userId}`);
    return virtualCardResponse.payload;
  }
}
