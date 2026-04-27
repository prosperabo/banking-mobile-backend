import { PaymentType } from '../shared/consts';

export interface ReceiptData {
  recipient: string;
  amount: string | number;
  currency: string;
  date?: string;
  time?: string;
  timezone?: string;
  reference: string;
}

export interface QrReceiptData extends ReceiptData {
  method: PaymentType;
  qrTransactionId?: string;
  provider?: string;
}
