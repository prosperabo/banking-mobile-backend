import { db } from '@/config/prisma';
import {
  push_device_tokens,
  push_device_tokens_platform,
} from '@prisma/client';

export const PushDeviceTokenRepository = {
  async findActiveTokensByUserId(
    userId: number
  ): Promise<push_device_tokens[]> {
    return db.push_device_tokens.findMany({
      where: { user_id: userId, is_active: true },
    });
  },

  async deactivateToken(fcmToken: string): Promise<void> {
    await db.push_device_tokens.update({
      where: { fcm_token: fcmToken },
      data: { is_active: false },
    });
  },

  async upsertDeviceToken(
    userId: number,
    fcmToken: string,
    platform: push_device_tokens_platform,
    deviceId?: string
  ): Promise<push_device_tokens> {
    // Case 3: same deviceId but Firebase rotated the token — update existing record by device
    if (deviceId) {
      const existingByDevice = await db.push_device_tokens.findFirst({
        where: { device_id: deviceId },
      });

      if (existingByDevice) {
        return db.push_device_tokens.update({
          where: { id: existingByDevice.id },
          data: {
            fcm_token: fcmToken,
            user_id: userId,
            is_active: true,
            updated_at: new Date(),
          },
        });
      }
    }

    // Case 1 (new token) and Case 2 (token already exists) — upsert by fcm_token
    return db.push_device_tokens.upsert({
      where: { fcm_token: fcmToken },
      update: {
        user_id: userId,
        ...(deviceId ? { device_id: deviceId } : {}),
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        device_id: deviceId,
        fcm_token: fcmToken,
        platform,
        is_active: true,
      },
    });
  },
};
