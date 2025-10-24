import { ApiResponse } from './api.backoffice.schemas';

export interface MerchantCategoryCode {
  mcc: string;
  description: string;
  categoryId: number;
  category: string;
  subcategoryId: number;
  subcategory: string;
}

export interface SimplifiedTransaction {
  id: number;
  date: string;
  title: string;
  category: string;
  amount: number;
}

export interface TransactionDetails {
  amount: string;
  timestamp: string;
  transactionType: number;
  status: number;
  transactionId: number;
  description: string;
  merchantCategoryCode: MerchantCategoryCode;
  referenceId?: number;
  captureMode: string;
  MDESDigitizedWalletID: string;
  isSettled: boolean;
  category: number;
  installments?: {
    totalCount: number;
  };
}

export interface GetTransactionsParams {
  customer_id: number;
  limit: number;
  offset?: number;
  from?: string;
  to?: string;
  desc?: boolean;
  transaction_id?: number;
  only_installment_charges?: boolean;
}

export interface GetTransactionsResponsePayload {
  transactions: TransactionDetails[];
  totalCount: number;
}

export type GetTransactionsResponse =
  ApiResponse<GetTransactionsResponsePayload>;
