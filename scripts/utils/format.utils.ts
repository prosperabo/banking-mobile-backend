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
    const nameParts = completeName.split(' ');

    return {
        firstName: nameParts[0] || completeName,
        lastName: nameParts.slice(1).join(' ') || 'Apellido',
        secondLastName: nameParts[2] || nameParts[1] || 'Apellido 2',
    };
}
