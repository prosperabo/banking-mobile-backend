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
