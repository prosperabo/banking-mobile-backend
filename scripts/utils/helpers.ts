import crypto from 'crypto';

/**
 * Maps gender string to numeric value expected by the backoffice API
 * @param gender - Gender string ('MASCULINO' or other)
 * @returns Numeric gender code (2 for MASCULINO, 1 for others)
 */
export function mapGender(gender: string): number {
  return gender === 'MASCULINO' ? 2 : 1;
}

/**
 * Creates a SHA256 hash of the provided password
 * @param password - Plain text password
 * @returns SHA256 hex digest of the password
 */
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Generates a unique device ID for the user
 * @param userId - User ID
 * @returns Formatted device ID string
 */
export function generateDeviceId(userId: number): string {
  return `device_${userId}_${Date.now()}`;
}

/**
 * Splits complete name into first, last and second last name components
 * @param completeName - Full name string
 * @returns Object with firstName, lastName, and secondLastName
 */
export function parseCompleteName(completeName: string) {
  const nameParts = completeName.split(' ');

  return {
    firstName: nameParts[0] || completeName,
    lastName: nameParts.slice(1).join(' ') || 'Apellido',
    secondLastName: nameParts[2] || nameParts[1] || 'Apellido 2',
  };
}

/**
 * Adds a delay between operations to avoid overwhelming the API
 * @param ms - Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
