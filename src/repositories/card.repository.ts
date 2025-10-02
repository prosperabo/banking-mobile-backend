import { db } from '@/config/prisma';

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
};
