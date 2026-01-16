import { ApiResponse } from './api.backoffice.schemas';

// Backoffice API request/response types
export interface TransferBackofficeRequest {
  amount: number;
  sourceCustomerID: number;
  targetID: number;
  description?: Record<string, unknown>;
}

export interface TransferPayload {
  transactionId: string;
}

// API endpoint request type
export interface TransferRequest {
  amount: number;
  target: string;
  description?: Record<string, unknown>;
}

// API endpoint response type using ApiResponse wrapper
export type TransferBackofficeResponse = ApiResponse<TransferPayload>;

export interface UserQRResponse {
  id: number;
  email: string;
  alias?: string;
  qrCode: string;
}
