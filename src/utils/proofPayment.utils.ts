import path from 'path';
import { ReceiptData } from '../schemas/receipt.schemas';
import { AttachmentOption, SendMailResult } from '../schemas/sender.schemas';
import { PaymentType } from '../shared/consts';
import { formatDateTime } from './dates.util';
import { sendMail } from './sender.util';

export function sendPaymentProofByEmail(
  typePayment: PaymentType,
  email: string,
  payload: Omit<ReceiptData, 'date' | 'time'> &
    Partial<Pick<ReceiptData, 'date' | 'time'>>,
  extraFilesOptions: AttachmentOption[]
): Promise<SendMailResult> {
  const { date, time } = formatDateTime();
  const data: ReceiptData = {
    ...payload,
    date: payload.date ?? date,
    time: payload.time ?? time,
    timezone: payload.timezone ?? 'CDMX',
  };
  return sendMail<ReceiptData>(
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
    `../../public/emails/${typePayment}-proof-of-payment.email.html`
  );
}
