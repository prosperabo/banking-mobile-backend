import path from 'path';
import { ReceiptData } from '../schemas/receipt.schemas';
import { AttachmentOption, SendMailResult } from '../schemas/sender.schemas';
import { PaymentType } from '../shared/consts';
import { formatDateTime } from './dates.util';
import { sendMail } from './sender.util';

export function sendPaymentProofByEmail<T extends ReceiptData>(
  typePayment: PaymentType,
  email: string,
  payload: Omit<T, 'date' | 'time'> & Partial<Pick<T, 'date' | 'time'>>,
  extraFilesOptions: AttachmentOption[]
): Promise<SendMailResult> {
  const { date, time } = formatDateTime();
  const data = {
    ...payload,
    date: payload.date ?? date,
    time: payload.time ?? time,
    timezone: payload.timezone ?? 'CDMX',
  } as T;
  return sendMail<T>(
    getViewProofOfPaymentTemplate(typePayment),
    { to: email, data },
    extraFilesOptions
  );
}

export function getViewProofOfPaymentTemplate(
  typePayment: PaymentType
): string {
  return path.resolve(
    __dirname,
    `../../public/emails/proofs-of-payment/${typePayment}-proof-of-payment.email.html`
  );
}
