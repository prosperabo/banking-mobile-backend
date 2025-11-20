import { buildLogger } from '../../src/utils';
import type { UserForMigration } from '../types';

const logger = buildLogger('ValidationUtils');

/**
 * Validates user data for migration
 * @param user - User data to validate
 * @returns True if valid, false otherwise
 */
export function validateUserForMigration(user: UserForMigration): boolean {
  const requiredFields = ['id', 'email', 'password', 'completeName'] as const;

  for (const field of requiredFields) {
    if (!user[field]) {
      logger.error(`Missing required field: ${field}`, { userId: user.id });
      return false;
    }
  }

  // Validate email format
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(user.email)) {
    logger.error('Invalid email format', {
      userId: user.id,
      email: user.email,
    });
    return false;
  }

  // Validate completeName has at least one word
  if (user.completeName.trim().split(' ').length < 1) {
    logger.error('Complete name must have at least one word', {
      userId: user.id,
      completeName: user.completeName,
    });
    return false;
  }

  return true;
}

/**
 * Sanitizes user phone number
 * @param phone - Raw phone number
 * @returns Sanitized phone number or default
 */
export function sanitizePhoneNumber(phone: string | null): string {
  if (!phone) return '5551234568';

  // Remove non-numeric characters
  const cleaned = phone.replace(/\\D/g, '');

  // Return cleaned number or default if too short
  return cleaned.length >= 10 ? cleaned : '5551234568';
}

/**
 * Validates and normalizes RFC
 * @param rfc - Raw RFC string
 * @returns Normalized RFC or default
 */
export function normalizeRFC(rfc: string | null): string {
  if (!rfc) return 'XAXX010101000';

  const cleaned = rfc.toUpperCase().trim();

  // Basic RFC validation (12-13 characters, alphanumeric)
  const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

  return rfcRegex.test(cleaned) ? cleaned : 'XAXX010101000';
}
