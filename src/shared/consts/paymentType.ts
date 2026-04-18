export const PaymentType = {
  external: 'external',
  internal: 'internal',
  link: 'link',
} as const;

export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType];
