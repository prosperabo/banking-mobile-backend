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
};
