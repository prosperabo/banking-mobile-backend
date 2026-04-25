export interface SendUserNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushNotificationData {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationSendResult {
  tokensFound: number;
  tokensSent: number;
  tokensDeactivated: number;
}

export interface RegisterDevicePayload {
  fcmToken: string;
  platform: 'ANDROID' | 'IOS';
  deviceId?: string;
  appVersion?: string;
}
