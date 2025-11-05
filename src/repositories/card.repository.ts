import { db } from '@/config/prisma';
import { Cards } from '@prisma/client';

export class CardRepository {
  static async getUserCards(userId: number) {
    return await db.cards.findMany({
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
  }

  static async getCardById(cardId: number) {
    return await db.cards.findUnique({
      where: { id: cardId },
      include: {
        BulkBatch: true,
      },
    });
  }

  static async updateCard(cardId: number, data: Partial<Cards>) {
    return await db.cards.update({
      where: { id: cardId },
      data,
    });
  }

  static async createCard(data: {
    userId: number;
    cardIdentifier: string;
    cardType: 'VIRTUAL' | 'PHYSICAL';
    prosperaCardId: string;
    status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE' | 'EXPIRED';
    maskedNumber?: string;
    expiryDate?: string;
    cvv?: string;
  }) {
    return await db.cards.create({
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }
}
