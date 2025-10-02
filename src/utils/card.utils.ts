export const formatMaskedNumber = (maskedNumber: string): string => {
  if (!maskedNumber) return '**** **** **** ****';
  // Ensure the masked number is in the format **** **** **** dddd
  const lastFourDigits = maskedNumber.slice(-4);
  return `**** **** **** ${lastFourDigits}`;
};
