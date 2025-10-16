import { db } from '@/config/prisma';

export const BackofficeRepository = {
  async findProfileByUserId(userId: number) {
    return db.backofficeCustomerProfile.findUnique({
      where: { userId },
    });
  },
};
