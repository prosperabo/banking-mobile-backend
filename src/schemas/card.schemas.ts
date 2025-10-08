import { ApiResponse } from './api.backoffice.schemas';

export interface ActivateCardParams {
  card_identifier: string;
  reference_batch: string;
  pin: string;
  customer_id: string;
}

export interface ActivateCardResponsePayload {
  reference_card: string;
  status_card: number;
  customer_id: number;
  card_id: number;
  customer_private_key: string;
  customer_refresh_token: string;
}

export type ActivateCardResponse = ApiResponse<ActivateCardResponsePayload>;

export interface GetCardInfoResponsePayload {
  cards: Array<{
    card_number: string;
    card_type: number;
    cvv: string;
    valid_date: string;
  }>;
}

export type GetCardInfoResponse = ApiResponse<GetCardInfoResponsePayload>;

export interface ActivateCardRequest {
  pin: string;
}

export interface viewPinForCustomerPayload {
  pin: string;
}

export type ViewPinForCustomerResponse = ApiResponse<viewPinForCustomerPayload>;

export interface StopCardParams {
  card_id: number;
  customer_id: number;
  new_card_status: number;
  note: string;
}

export interface StopCardResponsePayload {
  message: string;
  card_id: number;
  status: number;
}

export type StopCardResponse = ApiResponse<StopCardResponsePayload>;

export interface StopCardRequest {
  note?: string;
}

export interface UnstopCardParams {
  customer_id: number;
  card_id: number;
  note: string;
}

export interface UnstopCardResponsePayload {
  message: string;
  card_id: number;
  status: number;
}

export type UnstopCardResponse = ApiResponse<UnstopCardResponsePayload>;

export interface UnstopCardRequest {
  note?: string;
}
