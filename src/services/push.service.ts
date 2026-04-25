import { push_device_tokens_platform } from '@prisma/client';

import { PushDeviceTokenRepository } from '@/repositories/pushDeviceToken.repository';
import { RegisterDevicePayload } from '@/schemas/notification.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('PushService');

export class PushService {
  static async registerDevice(
    userId: number,
    payload: RegisterDevicePayload
  ): Promise<{ success: true }> {
    const platform = payload.platform as push_device_tokens_platform;

    logger.info('Registering push device token', {
      userId,
      platform,
      deviceId: payload.deviceId,
    });

    await PushDeviceTokenRepository.upsertDeviceToken(
      userId,
      payload.fcmToken,
      platform,
      payload.deviceId
    );

    logger.info('Push device token registered successfully', { userId });

    return { success: true };
  }
}
