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
