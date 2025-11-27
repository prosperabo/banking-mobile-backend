import { checkSchema, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import type { UserForMigration } from '../schemas/migration.schema';

export const userMigrationSchema: any = {
  id: {
    in: ['body'],
    isInt: true,
    toInt: true,
    errorMessage: 'ID must be an integer',
  },
  email: {
    in: ['body'],
    isEmail: true,
    errorMessage: 'Invalid email format',
  },
  password: {
    in: ['body'],
    isString: true,
    notEmpty: true,
    errorMessage: 'Password is required',
  },
  completeName: {
    in: ['body'],
    isString: true,
    trim: true,
    custom: {
      options: (value: string) => {
        return value.trim().split(' ').length >= 1;
      },
      errorMessage: 'Complete name must have at least one word',
    },
  },
};

export const validateUserMigration = checkSchema(userMigrationSchema);

export const validateUserMigrationMiddleware = [
  ...validateUserMigration,
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

/**
 * Validates user data for migration using express-validator logic
 * @param user - User data to validate
 * @returns Object with isValid boolean and errors array
 */
export async function validateUserForMigration(user: UserForMigration) {
  const req = { body: user } as any;

  // Run all validations
  await Promise.all(validateUserMigration.map(validation => validation.run(req)));

  const errors = validationResult(req);

  return {
    isValid: errors.isEmpty(),
    errors: errors.array(),
  };
}

/**
 * Sanitizes user phone number
 * @param phone - Raw phone number
 * @returns Sanitized phone number or default
 */
export function sanitizePhoneNumber(phone: string | null): string {
  if (!phone) return '5551234568';

  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

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
