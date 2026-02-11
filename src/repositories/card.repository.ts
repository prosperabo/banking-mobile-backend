import { db } from '@/config/prisma';
import { Cards, Cards_status, Cards_cardType } from '@prisma/client';
import { CardUserStatus } from '@/schemas/card.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('CardRepository');

export const CardRepository = {
  async getUserCards(userId: number) {
    return db.cards.findMany({
      where: { userId },
      select: {
        id: true,
        cardIdentifier: true,
        status: true,
        maskedNumber: true,
        cardType: true,
        prosperaCardId: true,
      },
    });
  },

  async getCardById(cardId: number) {
    return db.cards.findUnique({
      where: { id: cardId },
      include: {
        BulkBatch: true,
      },
    });
  },

  async updateCard(cardId: number, data: Partial<Cards>) {
    return db.cards.update({
      where: { id: cardId },
      data,
    });
  },

  async createCard(data: {
    userId: number;
    cardIdentifier: string;
    cardType: Cards_cardType;
    prosperaCardId?: string;
    status: Cards_status;
    maskedNumber?: string;
    expiryDate?: string;
    cvv?: string;
    bulkBatchId?: number;
    encryptedPin?: string;
  }) {
    return db.cards.create({
      data: {
        userId: data.userId,
        cardIdentifier: data.cardIdentifier,
        cardType: data.cardType,
        status: data.status,
        prosperaCardId: data.prosperaCardId,
        maskedNumber: data.maskedNumber,
        expiryDate: data.expiryDate,
        cvv: data.cvv,
        bulkBatchId: data.bulkBatchId,
        encryptedPin: data.encryptedPin,
        updatedAt: new Date(),
      },
    });
  },

  async getCardStatusByUser(userId: number) {
    const cards = await db.cards.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        cardType: true,
        maskedNumber: true,
        cardIdentifier: true,
        prosperaCardId: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.debug('Cards retrieved', { cards });

    const physical = {
      active: 0,
      inactive: 0,
      blocked: 0,
      expired: 0,
      total: 0,
    };

    const virtual = {
      active: 0,
      inactive: 0,
      blocked: 0,
      expired: 0,
      total: 0,
    };

    const cardDetails = cards.map(card => {
      const target = card.cardType === 'PHYSICAL' ? physical : virtual;
      target.total++;

      // Map database status to user-friendly status
      let userStatus: CardUserStatus;

      switch (card.status) {
        case Cards_status.ACTIVE:
          target.active++;
          userStatus = CardUserStatus.ACTIVE;
          break;
        case Cards_status.INACTIVE:
          target.inactive++;
          userStatus = card.prosperaCardId
            ? CardUserStatus.INACTIVE
            : CardUserStatus.PENDING;
          break;
        case Cards_status.PENDING: {
          // Check if card is PENDING and older than 5 days
          const now = new Date();
          const cardAge = now.getTime() - card.createdAt.getTime();
          const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;

          if (cardAge > fiveDaysInMs) {
            target.inactive++;
            userStatus = CardUserStatus.INACTIVE;
          } else {
            target.inactive++;
            userStatus = CardUserStatus.PENDING;
          }
          break;
        }
        case Cards_status.BLOCKED:
          target.blocked++;
          userStatus = CardUserStatus.BLOCKED;
          break;
        case Cards_status.EXPIRED:
          target.expired++;
          userStatus = CardUserStatus.EXPIRED;
          break;
      }

      return {
        id: card.id,
        cardType: card.cardType,
        status: userStatus,
        maskedNumber: card.maskedNumber || undefined,
        cardIdentifier: card.cardIdentifier,
        createdAt: card.createdAt.toISOString(),
      };
    });

    const hasCards = cards.length > 0;
    const hasActiveCards = physical.active > 0 || virtual.active > 0;
    const hasRequestedCards = physical.inactive > 0 || virtual.inactive > 0;

    return {
      hasCards,
      hasActiveCards,
      hasRequestedCards,
      summary: {
        physical,
        virtual,
      },
      cards: cardDetails,
    };
  },

  async findExistingPhysicalCard(userId: number) {
    return db.cards.findFirst({
      where: {
        userId,
        cardType: Cards_cardType.PHYSICAL,
        status: {
          in: [Cards_status.ACTIVE, Cards_status.INACTIVE],
        },
      },
    });
  },

  async updateCardByIdentifier(cardIdentifier: string, data: Partial<Cards>) {
    return db.cards.updateMany({
      where: {
        cardIdentifier,
      },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },
};
