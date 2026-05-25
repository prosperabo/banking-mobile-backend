export type NotificationType = 'announcement' | 'operational';

export type NotificationProcessReason =
  | 'new_announcement'
  | 'duplicate_announcement'
  | 'operational_notification'
  | 'unsupported_type';

export interface FirebaseAnnouncementDataDto {
  type: 'announcement';
  announcement_id: string;
  title: string;
  description: string;
  image_url?: string;
  redirect_url?: string;
}

export interface FirebaseOperationalDataDto {
  type: 'operational';
  title: string;
  description: string;
}

export type FirebaseIncomingDataDto =
  | FirebaseAnnouncementDataDto
  | FirebaseOperationalDataDto;

export interface ProcessNotificationResultDto {
  shouldDisplay: boolean;
  shouldPersist: boolean;
  reason: NotificationProcessReason;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  redirectUrl?: string;
  isRead: boolean;
  receivedAt: string;
  createdAt: string;
}

export interface NewsDto {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  redirectUrl?: string;
  appVersion?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetNewsQueryDto {
  appVersion?: string;
}

export interface CreateNewsQueryDto {
  appVersion?: string;
}

export interface CreateNewsBodyDto {
  title: string;
  description: string;
  redirectUrl?: string;
}

export interface CreateNewsFilesDto {
  image?: Express.Multer.File[];
}

export interface PublishNewsParamsDto {
  id: string;
}

export interface FirebaseAnnouncementPayloadDto {
  data: FirebaseAnnouncementDataDto;
}
