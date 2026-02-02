import { db } from '@/config/prisma';
import type {
  BackofficeCustomerProfileCreate,
  BackofficeCustomerProfileUpdate,
  BackofficeAuthStateCreate,
  BackofficeAuthStateUpdate,
} from '@/schemas';
import { AcademicInformation_academicArea } from '@prisma/client';

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

  async createAcademicInfo(
    userId: number,
    data: {
      actualSemester?: number;
      academicArea?: string;
      scholarshipPercentageRange?: string;
    }
  ) {
    return db.academicInformation.create({
      data: {
        userId,
        actualSemester: data.actualSemester,
        academicArea: data.academicArea as
          | AcademicInformation_academicArea
          | undefined,
        scholarshipPercentageRange: data.scholarshipPercentageRange,
      },
    });
  },
};
