import { ReceiptData } from './receiptData.schema';

export interface SendReceiptOptions {
  to: string | string[];
  subject?: string;
  data: ReceiptData;
}
