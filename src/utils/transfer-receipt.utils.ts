export const RECEIPT_TIMEZONE_LABEL = 'hora de CDMX';

export const maskClabe = (clabe: string): string => {
  const digits = clabe.replace(/\D/g, '');

  if (digits.length < 4) {
    return '***';
  }

  return `***${digits.slice(-4)}`;
};
