import { ApiResponse } from './api.backoffice.schemas';

export interface ActivateCardParams {
  card_identifier: string;
  reference_batch: string;
  pin: string;
  customer_id: string;
  balance: {
    id: number;
  };
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

export interface CardInfoResponsePayload {
  cards: Array<CardInfoDetails>;
}

export interface CardInfoDetails {
  balance_to_months: string;
  can_request_reorder_card: boolean;
  card_id: number;
  card_type: number;
  cardNumber: string;
  cardholderName?: string;
  credit_limit: string;
  credit_line: string;
  current_balance: string;
  cvv2?: string;
  duedate: string;
  expiryDate?: string;
  is_renewal_period: boolean;
  original_billing_day: number;
  overdue_balance: string;
  status: number;
  total_debt: string;
  trackingNumber?: string;
  validDate?: string;
  cat?: string;
  emissionFee?: string;
  fullName?: string;
  guarantee?: string;
  has_VCN?: boolean;
  has_deferred_charges?: boolean;
  interestRate?: string;
  isCardBlockedByTransactionReport?: boolean;
  minimumPayment?: string;
  reorder_card?: ReorderCardInfo;
  timeToPay?: boolean;
  urlContract?: string;
  urlContractCover?: string;
}

export interface ReorderCardInfo {
  replacedCardLastFourDigits?: string;
  statusId: number;
}

export type CardInfoResponse = ApiResponse<CardInfoResponsePayload>;

export interface UserCardInfoResponse {
  totalLimit: number;
  usedLimit: number;
  availableBalance: number;
  cutoffDate: string;
  paymentDueDate: string;
}

export interface CreateLinkedCardParams {
  campaign_id?: string;
  balance_id: number;
}

export interface CreateLinkedCardResponsePayload {
  card_id: number;
  card_number: string;
  cvv: string;
  valid_date: string;
  status: number;
  card_type: number;
}

export type CreateLinkedCardResponse =
  ApiResponse<CreateLinkedCardResponsePayload>;

export interface CreateLinkedCardRequest {
  campaign_id?: string;
}

export interface UpdateCVVParams {
  card_id: number;
}

export interface UpdateCVVResponsePayload {
  cvv2: string;
  expiration_time_in_minutes: number;
}

export type UpdateCVVResponse = ApiResponse<UpdateCVVResponsePayload>;
