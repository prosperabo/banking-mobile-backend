import { db } from '@/config/prisma';
import { Cards } from '@prisma/client';

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
    prosperaCardId: string;
    status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE' | 'EXPIRED';
    maskedNumber?: string;
    expiryDate?: string;
    cvv?: string;
  }) {
    return db.cards.create({
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },
};
