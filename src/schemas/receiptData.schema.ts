export interface ReceiptData {
  recipient: string;
  amount: string | number;
  currency: string;
  date?: string;
  time?: string;
  timezone?: string;
  reference: string;
  company?: string;
}
