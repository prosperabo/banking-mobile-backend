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
 * Interface for error handler result with retry logic and suggestions
 */
export interface ErrorHandlerResult {
  canRetry: boolean;
  reason: string;
  suggestions: string[];
  details: BackofficeError | Record<string, unknown> | null;
}