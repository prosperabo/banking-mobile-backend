import { db } from '@/config/prisma';

export const CardPickupRepository = {
  async create(data: {
    userId?: number;
    cardId: number;
    mobile: string;
    street: string;
    exteriorNumber: string;
    interiorNumber: string;
    neighborhood: string;
    city: string;
    state: string;
    postalCode: string;
    additionalNotes: string;
    isSlanPoint: boolean;
  }) {
    return db.cardPickup.create({ data });
  },
};
