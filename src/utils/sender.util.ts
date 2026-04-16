// utils/sender.util.ts

import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import { ReceiptData } from '../schemas/receiptData.schema';
import { SendReceiptOptions } from '../schemas/sendReceiptOptions.schema';
import { SendReceiptResult } from '../schemas/sendReceiptResult.schema';

const TEMPLATE_PATH = path.resolve(
  __dirname,
  '../public/link-proof-of-payment.html'
);

const DEFAULT_FROM = 'Slan Pagos <no-reply@slan.com>';
const DEFAULT_SUBJECT = 'Tu comprobante de recarga con link de pago';
const DEFAULT_TZ = 'CDMX';
const DEFAULT_EMPRESA = 'Prospera Fintech S.A.P.I. de C.V.';

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        '[sender.util] RESEND_API_KEY is not set in environment variables.'
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

function renderTemplate(data: ReceiptData): string {
  let html: string;

  try {
    html = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
  } catch {
    const errorMessage =
      `[sender.util] Could not read template at: ${TEMPLATE_PATH}. ` +
      'Make sure link-proof-of-payment.html is present in public/';
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const values: Record<string, string> = {
    receptor: data.recipient,
    monto: String(data.amount),
    moneda: data.currency,
    fecha: data.date,
    hora: data.time,
    timezone: data.timezone ?? DEFAULT_TZ,
    referencia: data.reference,
    empresa: data.company ?? DEFAULT_EMPRESA,
  };

  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key in values) return values[key];
    console.warn(`[sender.util] Unknown template placeholder: {{${key}}}`);
    return '';
  });
}

export async function sendReceipt(
  options: SendReceiptOptions
): Promise<SendReceiptResult> {
  const { to, subject, data } = options;

  let html: string;
  try {
    html = renderTemplate(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sender.util] Template render error:', message);
    return { success: false, error: message };
  }

  try {
    const resend = getResendClient();

    const { data: resendData, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: Array.isArray(to) ? to : [to],
      subject: subject ?? DEFAULT_SUBJECT,
      html,
    });

    if (error) {
      console.error('[sender.util] Resend API error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: resendData?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      '[sender.util] Unexpected error while sending email:',
      message
    );
    return { success: false, error: message };
  }
}
