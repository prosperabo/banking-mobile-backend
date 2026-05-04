import { ApiResponse } from './api.backoffice.schemas';

// Metadata type for payment data
export interface PaymentMetadata {
  userId?: number;
  [key: string]: string | number | boolean | undefined;
}

// Enums for payments
export enum PaymentProvider {
  CLIP = 'clip',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Request schemas
export interface PaymentCreateRequest {
  amount: number;
  currency?: string;
  description?: string;
  netAmountMxn?: number;
  metadata?: PaymentMetadata;
}

// Response for creating a payment
export interface PaymentServiceCreateResponse {
  paymentId: string;
  amount: number;
  currency: string;
  description?: string;
  status: PaymentStatus;
  paymentUrl: string; // Mock URL for payment
  createdAt: Date;
}

// Payment Provider API Payment Request
export interface PaymentProviderAPIPaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  payment_method: {
    token: string;
  };
  customer?: {
    email?: string;
    phone?: string;
  };
  prevention_data?: {
    session_id?: string;
    user_agent?: string;
  };
  metadata?: PaymentMetadata;
  webhook_url?: string;
}

export interface ProcessPaymentRequest {
  card_token: string;
  prevention_data?: {
    session_id?: string;
    user_agent?: string;
  };
}

// Payment Provider API Payment Response
export interface PaymentProviderPaymentResponse {
  id: string;
  amount: number;
  tip_amount: number;
  amount_refunded: number;
  installment_amount: number;
  installments: number;
  capture_method: string;
  net_amount: number;
  paid_amount: number;
  captured_amount: number;
  binary_mode: boolean;
  approved_at?: string;
  country: string;
  currency: string;
  description?: string;
  external_reference?: string;
  customer?: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  payment_method: {
    id: string;
    type: string;
    card?: {
      bin: string;
      issuer: string;
      name: string;
      country: string;
      last_digits: string;
      exp_year: string;
      exp_month: string;
    };
    token: string;
  };
  receipt_no: string;
  status: PaymentApiStatus;
  status_detail: {
    code: string;
    message: string;
  };
  pending_action?: {
    type: string;
    url: string;
  };
  metadata?: PaymentMetadata;
  created_at: string;
  version: number;
}

// Payment Status
export type PaymentApiStatus =
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'authorized'
  | 'refunded'
  | 'cancelled';

// Simplified response for client
export interface PaymentServiceClientResponse {
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusMessage: string;
  receiptNo?: string;
  approvedAt?: string;
  card?: {
    lastDigits: string;
    type: string;
    issuer: string;
  };
  pendingAction?: {
    type: string;
    url: string;
  };
}

// Webhook notification
export interface PaymentServiceWebhookNotification {
  event: 'payment.created' | 'payment.updated' | 'payment.refunded';
  payment: PaymentProviderPaymentResponse;
  timestamp: string;
}

export interface ClipWebhookPayload {
  id?: string;
  type?: string;
  event?: string;
  resource?: string;
  resource_id?: string;
  payment_id?: string;
  provider_payment_id?: string;
  status?: string;
  item?: {
    id?: string;
    payment_id?: string;
    status?: string;
    status_detail?: {
      code?: string;
      message?: string;
    };
    [key: string]: unknown;
  };
  data?: {
    id?: string;
    payment_id?: string;
    status?: string;
    status_detail?: {
      code?: string;
      message?: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface WalletTopUpRequest {
  externalTransactionId: string;
  balanceId: number;
  amount: number;
  sourceCustomerID: number;
  transactionType: 1;
}

export interface WalletTopUpResponsePayload {
  transactionId?: string | number;
  [key: string]: unknown;
}

export type WalletTopUpResponse = ApiResponse<WalletTopUpResponsePayload>;

export interface PaymentTopupPayload {
  status: PaymentStatus;
  externalTransactionId: string;
  amount: number;
  balanceId: number;
  sourceCustomerID: number;
  response?: WalletTopUpResponse;
  note?: string;
  error?: string;
}

export interface ClipWebhookProcessResponse {
  providerPaymentId: string;
  paymentId: string;
  status: PaymentStatus;
  topupTriggered: boolean;
  topupExternalTransactionId?: string;
}

// Refund request
export interface PaymentServiceRefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

// Database model type (matching Prisma schema)
export interface PaymentServiceDB {
  id: number;
  userId: number;
  clipPaymentId: string;
  cardToken: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  statusCode: string;
  statusMessage: string;
  description?: string;
  receiptNo?: string;
  authorizationCode?: string;
  cardLastDigits?: string;
  cardIssuer?: string;
  metadata: PaymentMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}
