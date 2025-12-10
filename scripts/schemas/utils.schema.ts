/**
 * @fileoverview Type definitions for utility functions and error handling
 * @description Contains interfaces for error handling, validation, and common utilities
 */

/**
 * Interface for backoffice API error details
 */
export interface BackofficeError {
  rfc?: string;
  mobile?: string;
  email?: string;
  [key: string]: string | undefined;
}

/**
 * Interface for validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: string;
  type: string;
}

/**
 * Interface for error handler result with retry logic and suggestions
 */
export interface ErrorHandlerResult {
  canRetry: boolean;
  reason: string;
  suggestions: string[];
  details: BackofficeError | ValidationErrorDetail[] | null;
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorDetail[];
}

/**
 * Interface for backoffice API response structure
 */
export interface BackofficeApiResponse {
  payload?: {
    reference_batch?: string;
    referenceBatch?: string;
    reference?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Interface for error logging context
 */
export interface ErrorLogContext {
  message: string;
  stack?: string;
  name: string;
  context: string;
  timestamp: string;
}