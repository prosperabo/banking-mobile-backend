// ─── SIP Provider Constant ────────────────────────────────────────────────────
export const SIP_PROVIDER = 'QRBMSC' as const;
export const SIP_PAYMENT_METHOD = 'QR' as const;

// ─── Currency ─────────────────────────────────────────────────────────────────
export type SipCurrency = 'BOB' | 'USD';

// ─── Request DTOs ─────────────────────────────────────────────────────────────

/** Body for POST /bmsc/payments/sip/qr */
export interface CreateSipQrRequestDto {
  amount: number;
  currency: SipCurrency;
  description?: string;
  netAmountMxn?: number;
}

/** Body sent to SIP /autenticacion/v1/generarToken */
export interface SipGenerateTokenBodyDto {
  username: string;
  password: string;
}

/** Body sent to SIP /api/v1/generaQr */
export interface SipGenerateQrRequestDto {
  alias: string;
  callback: string;
  detalleGlosa: string;
  monto: number;
  moneda: SipCurrency;
  fechaVencimiento: string; // dd/mm/yyyy
  tipoSolicitud: 'API';
  unicoUso: 'true';
}

// ─── Response DTOs (SIP API) ──────────────────────────────────────────────────

/** Response from SIP /autenticacion/v1/generarToken */
export interface SipGenerateTokenResponseDto {
  codigo: 'OK' | 'NOK';
  mensaje: string;
  objeto?: { token: string };
}

/** QR data object inside SIP response */
export interface SipQrObjeto {
  imagenQr: string;
  idQr: string;
  fechaVencimiento: string;
  bancoDestino: string;
  cuentaDestino: string;
  idTransaccion: number;
}

/** Response from SIP /api/v1/generaQr */
export interface SipGenerateQrResponseDto {
  codigo: string;
  mensaje: string;
  objeto?: SipQrObjeto;
}

// ─── Callback DTO ─────────────────────────────────────────────────────────────

/** Payload SIP sends to our POST /bmsc/payments/sip/callback */
export interface SipCallbackDto {
  alias: string;
  monto?: number;
  moneda?: string;
  idQr?: string;
  numeroOrdenOriginante?: string;
  fechaproceso?: string;
  cuentaCliente?: string;
  nombreCliente?: string;
  documentoCliente?: string;
}

/** Standard SIP success response */
export interface SipAckResponse {
  codigo: '0000';
  mensaje: 'Registro Exitoso';
}

// ─── Repository input types ───────────────────────────────────────────────────

export interface CreateSipPaymentInput {
  userId: number;
  orderId: string;
  amount: number;
  currency: SipCurrency;
  description: string;
  idempotencyKey: string;
  requestPayload: SipGenerateQrRequestDto;
  netAmountMxn?: number;
}

export interface UpdateSipQrResponseInput {
  paymentId: bigint;
  idQr: string;
  sipResponsePayload: SipQrObjeto;
}

export interface CompleteSipPaymentInput {
  paymentId: bigint;
  callbackPayload: SipCallbackDto;
}

// ─── Internal API response ────────────────────────────────────────────────────

/** Response returned to the frontend after QR creation */
export interface CreateSipQrResponseDto {
  paymentId: string;
  orderId: string;
  qrBase64: string;
  expiresAt: string;
  sip: {
    idQr?: string;
    idTransaccion?: number;
    bancoDestino?: string;
    cuentaDestino?: string;
  };
}
