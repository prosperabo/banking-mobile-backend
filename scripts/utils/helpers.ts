/**
 * @fileoverview General helper utilities for script operations
 * @description Provides common utility functions for migration scripts
 */

/**
 * Adds a delay between operations to avoid overwhelming the API
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after the specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
