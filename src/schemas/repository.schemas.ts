/**
 * @fileoverview Repository schemas for database operations
 * @description Type definitions for repository CRUD operations with Prisma abstraction
 */

import type {
  Users,
  BackofficeAuthState as PrismaBackofficeAuthState,
  BackofficeCustomerProfile as PrismaBackofficeCustomerProfile,
  Prisma,
} from '@prisma/client';

/**
 * Re-export Prisma types with abstraction layer
 */
export type User = Users;
export type BackofficeAuthState = PrismaBackofficeAuthState;
export type BackofficeCustomerProfile = PrismaBackofficeCustomerProfile;

/**
 * User with backoffice auth state relation
 */
export type UserWithAuthState = User & {
  BackofficeAuthState: BackofficeAuthState | null;
};

/**
 * Abstracted interfaces for create/update operations
 */
export type UserCreate = Prisma.UsersCreateInput;
export type UserUpdate = Prisma.UsersUpdateInput;

export type BackofficeCustomerProfileCreate =
  Prisma.BackofficeCustomerProfileCreateInput;
export type BackofficeCustomerProfileUpdate =
  Prisma.BackofficeCustomerProfileUpdateInput;

export type BackofficeAuthStateCreate = Prisma.BackofficeAuthStateCreateInput;
export type BackofficeAuthStateUpdate = Prisma.BackofficeAuthStateUpdateInput;

/**
 * Legacy interfaces for backwards compatibility (to be deprecated)
 * These are kept for backwards compatibility but should be replaced with Prisma types
 */
export type BackofficeProfileCreateData = Prisma.BackofficeCustomerProfileCreateInput;
export type BackofficeProfileUpdateData = Prisma.BackofficeCustomerProfileUpdateInput;
export type BackofficeAuthStateCreateData = Prisma.BackofficeAuthStateCreateInput;
export type BackofficeAuthStateUpdateData = Prisma.BackofficeAuthStateUpdateInput;
