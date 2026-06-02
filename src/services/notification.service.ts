import { firebaseMessaging } from '@/config/firebase';
import { PushDeviceTokenRepository } from '@/repositories/pushDeviceToken.repository';
import {
  SendUserNotificationPayload,
  NotificationSendResult,
} from '@/schemas/notification.schemas';
import { buildLogger } from '@/utils';
import {
  FirebaseAnnouncementPayloadDto,
  NewsDto,
} from '../schemas/news.schemas';
import { NotificationsType } from '@/shared/consts';

const logger = buildLogger('NotificationService');

const FIREBASE_INVALID_TOKEN_CODES = new Set([
  'messaging/invalid-registration-token',
  'messaging/registration-token-not-registered',
]);

export class NotificationService {
  static async sendToUser(
    userId: number,
    payload: SendUserNotificationPayload
  ): Promise<NotificationSendResult> {
    const activeTokens =
      await PushDeviceTokenRepository.findActiveTokensByUserId(userId);

    if (activeTokens.length === 0) {
      logger.warn(`No active push tokens found for user ${userId}`);
      return { tokensFound: 0, tokensSent: 0, tokensDeactivated: 0 };
    }

    let tokensSent = 0;
    let tokensDeactivated = 0;

    for (const deviceToken of activeTokens) {
      try {
        let sanitizedData = undefined;
        if (payload.data) {
          const data = Object.entries(payload.data).map(([k, v]) => [
            k,
            String(v),
          ]);
          sanitizedData = Object.fromEntries(data);
        }

        await firebaseMessaging.send({
          token: deviceToken.fcm_token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          ...(sanitizedData ? { data: sanitizedData } : {}),
        });

        tokensSent++;
      } catch (err: unknown) {
        const errorRecord = err as Record<string, unknown>;

        const hasErrorInfo =
          err instanceof Error &&
          'errorInfo' in errorRecord &&
          typeof errorRecord.errorInfo === 'object';

        const errorInfo = hasErrorInfo
          ? (errorRecord.errorInfo as Record<string, string>)
          : undefined;

        const firebaseCode = errorInfo?.code;

        if (firebaseCode && FIREBASE_INVALID_TOKEN_CODES.has(firebaseCode)) {
          logger.warn(`Deactivating invalid FCM token for user ${userId}`, {
            code: firebaseCode,
          });

          await PushDeviceTokenRepository.deactivateToken(
            deviceToken.fcm_token
          );
          tokensDeactivated++;
        } else {
          logger.error(`Failed to send push notification to user ${userId}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    logger.info(`Push notification sent to user ${userId}`, {
      tokensFound: activeTokens.length,
      tokensSent,
      tokensDeactivated,
    });

    return {
      tokensFound: activeTokens.length,
      tokensSent,
      tokensDeactivated,
    };
  }

  static async sendNewNotifications(newsDto: NewsDto): Promise<void> {
    const payload: FirebaseAnnouncementPayloadDto = {
      data: {
        type: NotificationsType.ANNOUNCEMENTS,
        announcement_id: newsDto.id,
        title: newsDto.title,
        description: newsDto.description,
        ...(newsDto.imageUrl && { image_url: newsDto.imageUrl }),
        ...(newsDto.redirectUrl && { redirect_url: newsDto.redirectUrl }),
      },
    };

    await firebaseMessaging.send({
      topic: NotificationsType.ANNOUNCEMENTS,
      data: { ...payload.data },
      notification: {
        title: newsDto.title,
        body: newsDto.description,
      },
    });

    logger.info(`Announcement notification sent for news ${newsDto.id}`);
  }
}
