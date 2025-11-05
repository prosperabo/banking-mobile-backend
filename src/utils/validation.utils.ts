import { BadRequestError } from '@/shared/errors';

/**
 * Validates that a value is not null or undefined
 * @param value - The value to validate
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): T {
  if (value === null || value === undefined) {
    throw new BadRequestError(`${fieldName} is required`);
  }
  return value;
}

/**
 * Validates that a string is not empty
 * @param value - The string to validate
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validateNonEmptyString(
  value: string | null | undefined,
  fieldName: string
): string {
  const validated = validateRequired(value, fieldName);
  if (typeof validated !== 'string' || validated.trim().length === 0) {
    throw new BadRequestError(`${fieldName} must be a non-empty string`);
  }
  return validated.trim();
}

/**
 * Validates that a number is positive
 * @param value - The number to validate
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validatePositiveNumber(
  value: number | null | undefined,
  fieldName: string
): number {
  const validated = validateRequired(value, fieldName);
  if (typeof validated !== 'number' || validated <= 0) {
    throw new BadRequestError(`${fieldName} must be a positive number`);
  }
  return validated;
}

/**
 * Validates that an email is in valid format
 * @param email - The email to validate
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validateEmail(
  email: string | null | undefined,
  fieldName: string = 'Email'
): string {
  const validated = validateNonEmptyString(email, fieldName);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(validated)) {
    throw new BadRequestError(`${fieldName} must be a valid email address`);
  }
  return validated;
}

/**
 * Validates that a value exists in an array of allowed values
 * @param value - The value to validate
 * @param allowedValues - Array of allowed values
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validateEnumValue<T>(
  value: T | null | undefined,
  allowedValues: readonly T[],
  fieldName: string
): T {
  const validated = validateRequired(value, fieldName);
  if (!allowedValues.includes(validated)) {
    throw new BadRequestError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`
    );
  }
  return validated;
}

/**
 * Validates that a card identifier has the correct format
 * @param cardIdentifier - The card identifier to validate
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validateCardIdentifier(
  cardIdentifier: string | null | undefined,
  fieldName: string = 'Card identifier'
): string {
  const validated = validateNonEmptyString(cardIdentifier, fieldName);
  // Add specific card identifier format validation if needed
  return validated;
}

/**
 * Validates that an ID is a positive integer
 * @param id - The ID to validate
 * @param fieldName - The name of the field for error messages
 * @throws BadRequestError if validation fails
 */
export function validateId(
  id: number | null | undefined,
  fieldName: string
): number {
  const validated = validateRequired(id, fieldName);
  if (!Number.isInteger(validated) || validated <= 0) {
    throw new BadRequestError(`${fieldName} must be a positive integer`);
  }
  return validated;
}
