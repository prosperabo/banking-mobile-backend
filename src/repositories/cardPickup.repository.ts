import { db } from '@/config/prisma';

export const CardPickupRepository = {
  async create(data: {
    userId?: number;
    cardId: number;
    pickupLocation: string;
    isSlanPoint: boolean;
  }) {
    return db.cardPickup.create({ data });
  },
};
