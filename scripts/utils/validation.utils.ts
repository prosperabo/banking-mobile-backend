/**
 * @fileoverview Data validation utilities for user migration
 * @description Provides validation functions and schemas for user data before backoffice migration
 */

import { checkSchema, validationResult, Schema } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import type { UserForMigration } from '../schemas/migration.schema';

/**
 * Express-validator schema for user migration data
 */
export const userMigrationSchema: Schema = {
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
 * @param user - User data to validate for migration
 * @returns Promise resolving to validation result with isValid boolean and errors array
 */
export async function validateUserForMigration(user: UserForMigration): Promise<{
    isValid: boolean;
    errors: unknown[];
}> {
    const req = { body: user } as Request;

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

/**
 * Generates a more realistic RFC for testing
 * @param name - User's name
 * @returns A valid-looking RFC for testing
 */
export function generateTestRFC(name: string): string {
  const nameParts = name.toUpperCase().split(' ');
  const firstNameInitials = nameParts[0]?.substring(0, 2) || 'XX';
  const lastNameInitial = nameParts[1]?.charAt(0) || 'X';
  const secondLastNameInitial = nameParts[2]?.charAt(0) || 'X';
  
  // Generate a test RFC: XXXXYYMMDDHXX
  const randomDate = '900101'; // Default test date
  const randomChars = 'H01'; // Default test chars
  
  return `${firstNameInitials}${lastNameInitial}${secondLastNameInitial}${randomDate}${randomChars}`;
}

/**
 * Validates mobile phone number for Mexican format
 * @param phone - Phone number to validate
 * @returns Object with validation result and cleaned phone
 */
export function validateMobilePhone(phone: string | null): {
  isValid: boolean;
  cleanedPhone: string;
  error?: string;
} {
  if (!phone) {
    return {
      isValid: false,
      cleanedPhone: '5551234568', // Default fallback
      error: 'Phone number is required'
    };
  }

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check length (Mexican mobile numbers are 10 digits)
  if (cleaned.length < 10) {
    return {
      isValid: false,
      cleanedPhone: '5551234568',
      error: 'Phone number too short (minimum 10 digits)'
    };
  }
  
  if (cleaned.length > 10) {
    // If more than 10 digits, take the last 10
    const truncated = cleaned.slice(-10);
    return {
      isValid: true,
      cleanedPhone: truncated,
      error: 'Phone number truncated to 10 digits'
    };
  }
  
  return {
    isValid: true,
    cleanedPhone: cleaned
  };
}

/**
 * Pre-validates user data before sending to backoffice
 * @param user - User data to validate and potentially correct
 * @returns Validation result with corrected data, warnings, and errors
 */
export function preValidateBackofficeData(user: UserForMigration): {
  isValid: boolean;
  correctedData: UserForMigration;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const correctedData = { ...user };
  
  // Validate and correct RFC
  if (!user.rfc) {
    const generatedRFC = generateTestRFC(user.completeName);
    correctedData.rfc = generatedRFC;
    warnings.push(`Generated RFC: ${generatedRFC}`);
  }
  
  // Validate and correct phone
  const phoneValidation = validateMobilePhone(user.phone);
  if (!phoneValidation.isValid) {
    if (phoneValidation.error) {
      warnings.push(`Phone: ${phoneValidation.error}`);
    }
    correctedData.phone = phoneValidation.cleanedPhone;
  } else {
    correctedData.phone = phoneValidation.cleanedPhone;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user.email)) {
    errors.push('Invalid email format');
  }
  
  // Validate complete name
  if (!user.completeName || user.completeName.trim().length < 2) {
    errors.push('Complete name is required and must be at least 2 characters');
  }
  
  return {
    isValid: errors.length === 0,
    correctedData,
    warnings,
    errors
  };
}
