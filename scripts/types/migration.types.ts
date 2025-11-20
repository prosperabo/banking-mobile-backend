import type { Users } from '@prisma/client';

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

export interface MigrationResult {
  success: boolean;
  user: string;
  reason?: string;
  externalCustomerId?: number;
}

export interface MigrationStats {
  successCount: number;
  failureCount: number;
  skippedCount: number;
  results: MigrationResult[];
}
