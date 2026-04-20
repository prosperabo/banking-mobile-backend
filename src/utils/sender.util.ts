import { Resend } from 'resend';
import { config } from '../config';
import {
  SenderOptions,
  AttachmentOption,
  SendMailResult,
  ResolvedAttachment,
} from '../schemas/sender.schemas';
import { resolveAttachment } from './attachment.util';
import { renderTemplate } from './templateMaker.util';

const {
  senderMail: { fromMail, resendApiKey },
} = config;

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    if (!resendApiKey) {
      throw new Error(
        '[sender.helpers] RESEND_API_KEY is not set in environment variables.'
      );
    }
    _resend = new Resend(resendApiKey);
  }
  return _resend;
}

export async function sendMail<T>(
  templatePath: string,
  options: SenderOptions<T>,
  attachments?: AttachmentOption[]
): Promise<SendMailResult> {
  const { to, subject, data } = options;

  let html: string;
  try {
    html = renderTemplate<T>(data, templatePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sender.util] Template render error:', message);
    return { success: false, error: message };
  }

  let resolvedAttachments: ResolvedAttachment[] = [];
  if (attachments?.length) {
    try {
      resolvedAttachments = await Promise.all(
        attachments.map(att => resolveAttachment(att, html, data))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[sender.util] Attachment resolution error:', message);
      return { success: false, error: message };
    }
  }

  try {
    const resend = getResendClient();

    const { data: resendData, error } = await resend.emails.send({
      from: fromMail,
      to: Array.isArray(to) ? to : [to],
      subject: subject ?? 'Slan - Notificación',
      html,
      attachments: resolvedAttachments,
    });

    if (error) {
      console.error('[sender.util] Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: resendData?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      '[sender.util] Unexpected error while sending email:',
      message
    );
    return { success: false, error: message };
  }
}
