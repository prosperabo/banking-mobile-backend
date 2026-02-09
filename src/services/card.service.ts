import { CardRepository } from '@/repositories/card.repository';
import {
  formatMaskedNumber,
  generateVirtualCardIdentifier,
  generatePhysicalCardIdentifier,
} from '@/utils/card.utils';
import { ActivateCardResponse } from '@/schemas/card.schemas';
import { buildLogger } from '@/utils';
import { CardBackofficeService } from '@/services/card.backoffice.service';
import {
  CreateLinkedCardResponsePayload,
  StopCardResponsePayload,
  UnstopCardResponsePayload,
  UserCardInfoResponse,
  UpdateCVVResponsePayload,
  ShowCvvResponsePayload,
  CardStatusResponse,
  RequestPhysicalCardRequest,
  RequestPhysicalCardResponse,
  CardUserStatus,
} from '@/schemas/card.schemas';
import { BackofficeRepository } from '@/repositories/backoffice.repository';
import { UserRepository } from '@/repositories/user.repository';
import { BulkBatchRepository } from '@/repositories/bulkBatch.repository';
import backOfficeInstance from '@/api/backoffice.instance';
import { config } from '@/config';

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

    // Update card: set prosperaCardId (if not set) and change status to ACTIVE
    // This transitions the card from DELIVERED → ACTIVE
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
    const currentBalance =
      parseFloat(cardInfo.credit_limit) - parseFloat(cardInfo.credit_line);
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

  static async updateCardCVV(
    cardId: number,
    customerToken: string,
    _customerId: number
  ): Promise<UpdateCVVResponsePayload> {
    logger.info(`Updating CVV for card ${cardId}`);

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

    const updateResponse = await CardBackofficeService.updateCardCVV(
      {
        card_id: Number(card.prosperaCardId),
      },
      customerToken
    );

    logger.info(`Card CVV ${cardId} updated successfully`);
    return updateResponse.payload;
  }

  static async showCardCvv(
    cardId: number,
    customerToken: string,
    customerId: number
  ): Promise<ShowCvvResponsePayload> {
    logger.info('Showing CVV for card', { cardId });

    const card = await CardRepository.getCardById(cardId);
    if (!card) {
      logger.error('Card not found', { cardId });
      throw new Error('Card not found');
    }

    const strategies: Record<string, () => Promise<ShowCvvResponsePayload>> = {
      PHYSICAL: async () => {
        logger.info('Physical card handler', { cardId });
        const details = await this.getCardDetailsById(
          cardId,
          customerToken,
          customerId
        );

        const { cvv } = details;

        return { cvv };
      },
      VIRTUAL: async () => {
        logger.info('Virtual card handler: updating CVV then returning it', {
          cardId,
        });

        const updatePayload = await this.updateCardCVV(
          cardId,
          customerToken,
          customerId
        );

        return {
          cvv: updatePayload.cvv2,
          expiration_time_in_minutes: updatePayload.expiration_time_in_minutes,
        };
      },
    };

    const handler = strategies[card.cardType];
    if (!handler) {
      logger.error('Unsupported card type', { cardType: card.cardType });
      throw new Error('Unsupported card type');
    }

    return handler();
  }

  /**
   * Get card status for a user
   */
  static async getCardStatus(userId: number): Promise<CardStatusResponse> {
    logger.info(`Getting card status for user ${userId}`);
    const status = await CardRepository.getCardStatusByUser(userId);
    logger.info('Card status retrieved successfully', { userId, status });
    return status;
  }

  /**
   * Request a physical card for a user
   */
  static async requestPhysicalCard(
    userId: number,
    deliveryType: 'home' | 'slan',
    requestData: RequestPhysicalCardRequest
  ): Promise<RequestPhysicalCardResponse> {
    logger.info(`Requesting physical card for user ${userId}`, {
      deliveryType,
      requestData,
    });

    // Get user data
    const user = await UserRepository.findById(userId);
    if (!user) {
      logger.error(`User ${userId} not found`);
      throw new Error('User not found');
    }

    // Check if user already has a physical card requested or active
    const existingPhysicalCards =
      await CardRepository.findExistingPhysicalCard(userId);

    if (existingPhysicalCards) {
      logger.warn(`User ${userId} already has a physical card`);
      throw new Error('You already have a physical card requested or active');
    }

    // Generate unique card identifier
    const cardIdentifier = generatePhysicalCardIdentifier();
    const pin = user.pin || '1234';

    // Prepare delivery location based on delivery type
    const deliveryTypeHandlers = {
      slan: () => ({
        first_names: user.firstName || 'Cliente',
        last_names: user.lastName || 'Prospera',
        street: 'Alcatraz M61 L1, jardines del sur 5',
        exterior_number: '5',
        interior_number: '21',
        neighborhood: 'Jardines del sur 5',
        city: 'Cancún',
        state: 'Quintana Roo',
        postal_code: '77536',
        mobile: user.phone ? Number(user.phone) : 9983940931,
        additional_notes: requestData.pickupLocation
          ? `Pickup location: ${requestData.pickupLocation}`
          : 'Delivery to Slan point',
      }),
      home: () => {
        if (!requestData.billingAddress) {
          logger.error('Billing address is required for home delivery');
          throw new Error('Billing address is required for home delivery');
        }

        return {
          first_names: requestData.billingAddress.firstName,
          last_names: requestData.billingAddress.lastName,
          street: requestData.billingAddress.street,
          exterior_number: requestData.billingAddress.exteriorNumber,
          interior_number: requestData.billingAddress.interiorNumber || '1',
          neighborhood: requestData.billingAddress.neighborhood,
          city: requestData.billingAddress.city,
          state: requestData.billingAddress.state,
          postal_code: requestData.billingAddress.postalCode,
          mobile: Number(requestData.billingAddress.phone),
          additional_notes:
            requestData.billingAddress.additionalNotes ||
            (requestData.pickupLocation
              ? `Pickup location: ${requestData.pickupLocation}`
              : 'Physical card requested via mobile app'),
        };
      },
    };

    const handler = deliveryTypeHandlers[deliveryType];
    if (!handler) {
      logger.error(`Unsupported delivery type: ${deliveryType}`);
      throw new Error('Unsupported delivery type');
    }

    const deliveryLocation = handler();

    // Prepare batch data for backoffice
    // Uncommentd when we use this var
    // const frontName =
    //   deliveryType === 'slan'
    //     ? `${user.firstName || 'Cliente'} ${user.lastName || 'Prospera'}`.trim()
    //     : `${requestData.billingAddress!.firstName} ${requestData.billingAddress!.lastName}`.trim();

    const bulkOrderData = {
      delivery_location: deliveryLocation,
      campaign_id: config.campaing.programCode,
      batch: [
        {
          card_identifier: cardIdentifier,
          // front_name: frontName,
          qr: 'https://slan.mx/card-activation',
          pin,
        },
      ],
    };

    logger.info('Sending bulk order request to backoffice', { bulkOrderData });

    // Send request to backoffice
    const response = await backOfficeInstance.post<{
      payload: {
        reference_batch?: string;
        reference?: string;
        referenceBatch?: string;
        status: number;
      };
      message: string;
      status: number;
    }>('/debit/v1/bulkOrderCard', bulkOrderData, {
      headers: {
        'Authorization-ecommerce': config.ecommerceToken,
      },
    });

    logger.info('Backoffice response received', { response: response.data });

    const payload = response.data.payload;
    const referenceBatch =
      payload?.reference_batch || payload?.reference || payload?.referenceBatch;

    if (!referenceBatch) {
      logger.error('No reference batch in response', {
        response: response.data,
      });
      throw new Error('Failed to get reference batch from backoffice');
    }

    // Create bulk batch record
    const bulkBatch = await BulkBatchRepository.create({
      referenceBatch: String(referenceBatch),
      status: payload.status || 1,
      numCreated: 0,
      numFailed: 0,
      requestedAt: new Date(),
    });

    // Create card record (without prosperaCardId to start as PENDING)
    const card = await CardRepository.createCard({
      userId,
      bulkBatchId: bulkBatch.id,
      cardType: 'PHYSICAL',
      cardIdentifier,
      status: 'INACTIVE',
      encryptedPin: pin,
      // prosperaCardId: null - Not set yet, card is in PENDING state
    });

    logger.info(`Physical card created successfully for user ${userId}`, {
      cardId: card.id,
      cardIdentifier,
    });

    // Get updated card status
    const cardStatus = await this.getCardStatus(userId);

    return {
      success: true,
      message: 'Physical card requested successfully',
      cardId: card.id,
      cardIdentifier: card.cardIdentifier,
      status: CardUserStatus.PENDING,
      pickupLocation: requestData.pickupLocation,
      cardStatus: {
        hasActiveCards: cardStatus.hasActiveCards,
        hasRequestedCards: cardStatus.hasRequestedCards,
        summary: cardStatus.summary,
        cards: cardStatus.cards,
      },
    };
  }
}
