import { db } from '@/config/prisma';
import type {
  BackofficeCustomerProfileCreate,
  BackofficeCustomerProfileUpdate,
  BackofficeAuthStateCreate,
  BackofficeAuthStateUpdate,
} from '@/schemas';

export const BackofficeRepository = {
  async upsertProfile(
    userId: number,
    createData: BackofficeCustomerProfileCreate,
    updateData: BackofficeCustomerProfileUpdate
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
    createData: BackofficeAuthStateCreate,
    updateData: BackofficeAuthStateUpdate
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
