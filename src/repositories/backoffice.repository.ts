import { db } from '@/config/prisma';
import { BackofficeCustomerProfile } from '@prisma/client';

export class BackofficeRepository {
  static async findProfileByUserId(
    userId: number
  ): Promise<BackofficeCustomerProfile | null> {
    return await db.backofficeCustomerProfile.findUnique({
      where: { userId },
    });
  }
}
