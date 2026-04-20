export interface SenderOptions<T> {
  to: string | string[];
  subject?: string;
  data: T;
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type AttachmentFormat = 'pdf' | 'image';

export interface EmailAsAttachment {
  type: 'from-email';
  format: AttachmentFormat;
  filename?: string;
}

export interface FileAttachment {
  type: 'file';
  filePath: string;
  filename?: string;
  htmlConvertTo?: AttachmentFormat;
}

export type AttachmentOption = EmailAsAttachment | FileAttachment;

export interface ResolvedAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}
