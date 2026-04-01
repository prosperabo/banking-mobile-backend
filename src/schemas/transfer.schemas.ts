import { ApiResponse } from './api.backoffice.schemas';

// Backoffice API request/response types
export interface TransferBackofficeRequest {
  amount: number;
  sourceCustomerID: number;
  targetID: number;
  description?: Record<string, unknown>;
}

export interface SpeiCashoutBackofficeRequest {
  clabe: string;
  amount: number;
  description?: string;
}

export interface TransferPayload {
  transactionId: string;
}

export interface SpeiCashoutPayload {
  transactionId: number;
}

// API endpoint request type
export interface TransferRequest {
  amount: number;
  target: string;
  description?: Record<string, unknown>;
}

export interface SpeiCashoutRequest {
  clabe: string;
  amount: number;
  receiverName: string;
  entityName: string;
  description?: string;
}

export type ReceiptType = 'internal_transfer' | 'spei_cashout';

export interface BaseTransferReceipt {
  receiptType: ReceiptType;
  title: string;
  dateTime: string;
  timezone: string;
  amount: number;
  senderName: string;
  receiverName: string;
}

export interface InternalTransferReceipt extends BaseTransferReceipt {
  receiptType: 'internal_transfer';
}

export interface SpeiCashoutReceipt extends BaseTransferReceipt {
  receiptType: 'spei_cashout';
  entityName: string;
  receiverClabeMasked: string;
}

export type TransferReceiptResponse =
  | InternalTransferReceipt
  | SpeiCashoutReceipt;

export interface TransferTransactionResponse {
  transactionId: string | number;
}

export interface TransferOperationResponse {
  transaction: TransferTransactionResponse;
  receipt: TransferReceiptResponse;
}

// API endpoint response type using ApiResponse wrapper
export type TransferBackofficeResponse = ApiResponse<TransferPayload>;
export type SpeiCashoutBackofficeResponse = ApiResponse<SpeiCashoutPayload>;

export interface UserQRResponse {
  id: number;
  email: string;
  alias?: string;
  qrCode: string;
}

export interface AccountInfoResponse {
  clabe: string;
  bankReceptor: string;
  beneficiaryName: string;
}

export interface ClabeBackofficeResponse {
  rs: {
    spei_clabe: string;
  };
}

export interface UserBackofficeResponse {
  rs: {
    account_level: number;
    address: string;
    address_detail: string;
    city: string;
    country_of_birth: string;
    curp: string;
    customer_status: number;
    date_of_birth: string;
    email: string;
    first_name: string;
    gender: number;
    id: number;
    last_name: string;
    middle_name: string;
    mobile: number;
    occupation_id: number;
    rfc: string;
    risk_level: number;
    second_last_name: string;
    state: number;
    zipcode: string;
  };
}
