import { randomBytes } from 'crypto';

export const formatMaskedNumber = (
  cardNumber?: string,
  withSpaces: boolean = true
): string => {
  const digits = (cardNumber ?? '').replace(/\D/g, '');
  const fullMaskSpaced = '**** **** **** ****';
  const fullMaskCompact = '****************';

  if (!digits || digits.length < 4) {
    return withSpaces ? fullMaskSpaced : fullMaskCompact;
  }

  const last4 = digits.slice(-4);
  return withSpaces ? `**** **** **** ${last4}` : `************${last4}`;
};

export const generateVirtualCardIdentifier = (userId: number): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `VIRTUAL_${timestamp}_${userId}_${randomSuffix}`;
};

export const generateUpdateDigit = (): string => {
  // Generate a random 3-digit string between 100 and 999
  const value = Math.floor(Math.random() * 900) + 100;
  return String(value);
};

export const generatePhysicalCardIdentifier = (): string => {
  const ts = Date.now();
  const suffix = randomBase32(6);
  return `PHYSICAL_${ts}_${suffix}`;
};

const randomBase32 = (len: number): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = randomBytes(len);
  return Array.from(bytes)
    .map(b => alphabet[b % alphabet.length])
    .join('');
};
