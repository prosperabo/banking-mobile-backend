/**
 * @fileoverview Type definitions for user migration operations
 * @description Contains interfaces for migration data structures and results
 */

import type { Users } from '@prisma/client';

/**
 * Represents user data required for migration to the backoffice system
 * Subset of Users entity with essential fields for account creation
 */
export type UserForMigration = Pick<
  Users,
  | 'id'
  | 'email'
  | 'password'
  | 'phone'
  | 'completeName'
  | 'gender'
  | 'birthDate'
  | 'birthCountry'
  | 'curp'
  | 'postalCode'
  | 'state'
  | 'country'
  | 'municipality'
  | 'street'
  | 'colony'
  | 'externalNumber'
  | 'internalNumber'
  | 'rfc'
>;

/**
 * Represents the result of a single user migration attempt
 */
export interface MigrationResult {
  /** Whether the migration was successful */
  success: boolean;
  /** User identifier (email or ID) */
  user: string;
  /** Reason for failure (only present when success is false) */
  reason?: string;
  /** External customer ID from backoffice (only present when success is true) */
  externalCustomerId?: number;
}

/**
 * Statistics and results for a batch migration operation
 */
export interface MigrationStats {
  /** Number of successful migrations */
  successCount: number;
  /** Number of failed migrations */
  failureCount: number;
  /** Number of skipped users (already migrated) */
  skippedCount: number;
  /** Detailed results for each migration attempt */
  results: MigrationResult[];
}
