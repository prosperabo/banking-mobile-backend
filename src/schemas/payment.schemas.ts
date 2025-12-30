// Metadata type for payment data
export interface PaymentMetadata {
  userId?: number;
  [key: string]: string | number | boolean | undefined;
}

// Request schemas
export interface PaymentServicePaymentRequest {
  card_token: string;
  amount: number;
  currency?: string;
  description?: string;
  customer?: {
    email?: string;
    phone?: string;
  };
  metadata?: PaymentMetadata;
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
  metadata?: PaymentMetadata;
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
  status: PaymentStatus;
  status_detail: {
    code: string;
    message: string;
  };
  metadata?: PaymentMetadata;
  created_at: string;
  version: number;
}

// Payment Status
export type PaymentStatus =
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
}

// Webhook notification
export interface PaymentServiceWebhookNotification {
  event: 'payment.created' | 'payment.updated' | 'payment.refunded';
  payment: PaymentProviderPaymentResponse;
  timestamp: string;
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
  status: string;
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
