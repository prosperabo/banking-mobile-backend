export const RangeTransaction = {
  DAILY: 'daily',
  MONTHLY: 'monthly',
} as const;

export type RangeTransactionType =
  (typeof RangeTransaction)[keyof typeof RangeTransaction];
