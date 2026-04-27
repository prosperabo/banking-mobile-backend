export const PaymentType = {
  external: 'external',
  internal: 'internal',
  link: 'link',
  qr: 'qr',
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
