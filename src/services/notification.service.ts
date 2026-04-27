import { firebaseMessaging } from '@/config/firebase';
import { PushDeviceTokenRepository } from '@/repositories/pushDeviceToken.repository';
import {
  SendUserNotificationPayload,
  NotificationSendResult,
} from '@/schemas/notification.schemas';
import { buildLogger } from '@/utils';

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
        await firebaseMessaging.send({
          token: deviceToken.fcm_token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          ...(payload.data ? { data: payload.data } : {}),
        });

        tokensSent++;
      } catch (err: unknown) {
        const firebaseCode =
          err instanceof Error &&
          'errorInfo' in err &&
          typeof (err as Record<string, unknown>).errorInfo === 'object'
            ? (
                (err as Record<string, unknown>).errorInfo as Record<
                  string,
                  string
                >
              ).code
            : undefined;

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
}
