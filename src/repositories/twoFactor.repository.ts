import { db } from '@/config/prisma';
import { TwoFactorAuth } from '@prisma/client';

export const TwoFactorRepository = {
  /**
   * Creates a new 2FA configuration for a user
   */
  async create(userId: number, secret: string): Promise<TwoFactorAuth> {
    return db.twoFactorAuth.create({
      data: {
        userId,
        secret,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Finds the 2FA configuration for a user
   */
  async findByUserId(userId: number): Promise<TwoFactorAuth | null> {
    return db.twoFactorAuth.findUnique({
      where: { userId },
    });
  },

  /**
   * Updates the 2FA configuration for a user
   */
  async update(userId: number, secret: string): Promise<TwoFactorAuth> {
    return db.twoFactorAuth.update({
      where: { userId },
      data: {
        secret,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Deletes the 2FA configuration for a user
   */
  async delete(userId: number): Promise<void> {
    await db.twoFactorAuth.delete({
      where: { userId },
    });
  },

  /**
   * Checks if a user has 2FA configured
   */
  async exists(userId: number): Promise<boolean> {
    const count = await db.twoFactorAuth.count({
      where: { userId },
    });
    return count > 0;
  },
};
