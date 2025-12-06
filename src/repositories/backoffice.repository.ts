import { db } from '@/config/prisma';
import { Prisma } from '@prisma/client';

export const BackofficeRepository = {
  async upsertProfile(
    userId: number,
    createData: Prisma.BackofficeCustomerProfileCreateInput,
    updateData: Prisma.BackofficeCustomerProfileUpdateInput
  ) {
    return db.backofficeCustomerProfile.upsert({
      where: { userId },
      create: createData,
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  },

  async upsertAuthState(
    userId: number,
    createData: Prisma.BackofficeAuthStateCreateInput,
    updateData: Prisma.BackofficeAuthStateUpdateInput
  ) {
    return db.backofficeAuthState.upsert({
      where: { userId },
      create: createData,
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  },

  async findProfileByUserId(userId: number) {
    return db.backofficeCustomerProfile.findUnique({
      where: { userId },
    });
  },
};
