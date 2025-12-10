import { buildLogger } from '../../src/utils';
import type { BackofficeError, ErrorHandlerResult } from '../schemas';

const logger = buildLogger('BackofficeErrorHandler');

/**
 * Handles backoffice API errors and provides actionable feedback
 */
export class BackofficeErrorHandler {
  /**
   * Handles specific backoffice API errors and provides actionable feedback
   * @param error - Error response from backoffice API
   * @param _userEmail - User email for logging context (currently unused)
   * @returns Processed error information
   */
  static handleBackofficeError(
    error: Error,
    _userEmail: string
  ): ErrorHandlerResult {
    const suggestions: string[] = [];
    let canRetry = false;
    let reason = 'Unknown backoffice error';
    let details: BackofficeError | Record<string, unknown> | null = null;

    try {
      // Handle common backoffice errors
      if (error.name === 'UnprocessableEntityError') {
        reason = 'Validation error - check data format';
        details = { errorType: 'ValidationError' };
        canRetry = true;
        suggestions.push('Check RFC format');
        suggestions.push('Verify email and mobile format');
      } else if (error.name === 'BadRequestError') {
        reason = 'Bad request - likely duplicate data';
        details = { errorType: 'DuplicateError' };
        canRetry = false;
        suggestions.push('Check for duplicate mobile or email');
      } else if (error.name === 'ConflictError') {
        reason = 'Conflict error - resource already exists';
        details = { errorType: 'ConflictError' };
        canRetry = false;
      } else if (error.name === 'ForbiddenError') {
        reason = 'Forbidden - access denied';
        details = { errorType: 'ForbiddenError' };
        canRetry = false;
      } else if (error.name === 'NotFoundError') {
        reason = 'Resource not found';
        details = { errorType: 'NotFoundError' };
        canRetry = true;
      } else if (error.name === 'InternalServerError') {
        reason = 'Internal server error';
        details = { errorType: 'InternalServerError' };
        canRetry = true;
      } else {
        reason = error.message || 'Unknown error';
        details = { errorType: 'UnknownError' };
        canRetry = false;
      }

      return { canRetry, reason, suggestions, details };
    } catch (parseError) {
      logger.error('Failed to parse backoffice error:', { parseError, originalError: error });
      reason = 'Failed to parse error response';
      suggestions.push('Check backoffice API response format');
      
      return { canRetry: false, reason, suggestions, details };
    }
  }

  /**
   * Determines if an error is retryable based on the error type
   * @param error - Error object
   * @returns Whether the error can be retried
   */
  static isRetryableError(error: Error): boolean {
    const errorWithCode = error as Error & { code?: string; response?: { status?: number } };
    
    // Network errors are usually retryable
    if (errorWithCode.code === 'ECONNRESET' || errorWithCode.code === 'ETIMEDOUT') {
      return true;
    }
    
    // 5xx server errors are retryable
    if (errorWithCode.response?.status && errorWithCode.response.status >= 500) {
      return true;
    }
    
    // 429 rate limit is retryable
    if (errorWithCode.response?.status === 429) {
      return true;
    }
    
    return false;
  }

  /**
   * Formats error information for logging
   * @param error - Error object
   * @param context - Additional context
   * @returns Formatted error info
   */
  static formatErrorForLogging(error: Error, context: string): Record<string, unknown> {
    const errorWithResponse = error as Error & { 
      response?: { 
        status?: number; 
        statusText?: string; 
        data?: unknown 
      } 
    };

    return {
      context,
      message: error.message || 'Unknown error',
      status: errorWithResponse.response?.status,
      statusText: errorWithResponse.response?.statusText,
      data: errorWithResponse.response?.data,
      stack: error.stack
    };
  }
}