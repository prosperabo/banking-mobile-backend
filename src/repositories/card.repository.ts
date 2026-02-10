import { db } from '@/config/prisma';
import { Cards } from '@prisma/client';
import { CardUserStatus } from '@/schemas/card.schemas';

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
    cardType: 'VIRTUAL' | 'PHYSICAL';
    prosperaCardId?: string;
    status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE' | 'EXPIRED';
    maskedNumber?: string;
    expiryDate?: string;
    cvv?: string;
    bulkBatchId?: number;
    encryptedPin?: string;
  }) {
    return db.cards.create({
      data: {
        ...data,
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

      if (card.status === 'ACTIVE') {
        target.active++;
        userStatus = CardUserStatus.ACTIVE;
      } else if (card.status === 'INACTIVE') {
        target.inactive++;
        // Diferenciar entre solicitada (sin prosperaCardId) y entregada (con prosperaCardId)
        // prosperaCardId se asigna cuando la tarjeta física llega y está lista para activar
        userStatus = card.prosperaCardId
          ? CardUserStatus.DELIVERED
          : CardUserStatus.PENDING;
      } else if (card.status === 'BLOCKED') {
        target.blocked++;
        userStatus = CardUserStatus.BLOCKED;
      } else {
        target.expired++;
        userStatus = CardUserStatus.EXPIRED;
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
        cardType: 'PHYSICAL',
        status: {
          in: ['ACTIVE', 'INACTIVE'],
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
