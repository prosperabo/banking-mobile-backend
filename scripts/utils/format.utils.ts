/**
 * @fileoverview Data formatting utilities for backoffice API compatibility
 * @description Provides functions to transform user data into backoffice-expected formats
 */

/**
 * Maps gender string to numeric value expected by the backoffice API
 * @param gender - Gender string ('MASCULINO' or other values)
 * @returns Numeric gender code (2 for MASCULINO, 1 for others)
 */
export function mapGender(gender: string): number {
  return gender === 'MASCULINO' ? 2 : 1;
}

/**
 * Splits complete name into first, last and second last name components
 * @param completeName - Full name string to parse
 * @returns Object with firstName, lastName, and secondLastName properties
 */
export function parseCompleteName(completeName: string): {
  firstName: string;
  lastName: string;
  secondLastName: string;
} {
  const nameParts = completeName.trim().split(/\s+/);

  if (nameParts.length >= 3) {
    return {
      firstName: nameParts.slice(0, -2).join(' '),
      lastName: nameParts[nameParts.length - 2],
      secondLastName: nameParts[nameParts.length - 1],
    };
  } else if (nameParts.length === 2) {
    return {
      firstName: nameParts[0],
      lastName: nameParts[1],
      secondLastName: '',
    };
  } else {
    return {
      firstName: nameParts[0] || completeName,
      lastName: '',
      secondLastName: '',
    };
  }
}
