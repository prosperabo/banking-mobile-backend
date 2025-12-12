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
 */
export interface BackofficeProfileCreateData {
  userId: number;
  externalCustomerId: string;
  ewalletId: string;
}

export interface BackofficeProfileUpdateData {
  externalCustomerId?: string;
  ewalletId?: string;
  updatedAt?: Date;
}

export interface BackofficeAuthStateCreateData {
  userId: number;
  clientState: number;
  deviceId: string;
  privateKey: string;
  refreshToken: string;
  extraLoginData: string;
  lastCustomerOauthToken: string;
  externalCustomerId: string;
  ewalletId: string;
}

export interface BackofficeAuthStateUpdateData {
  clientState?: number;
  deviceId?: string;
  privateKey?: string;
  refreshToken?: string;
  extraLoginData?: string;
  lastCustomerOauthToken?: string;
  externalCustomerId?: string;
  ewalletId?: string;
  updatedAt?: Date;
}
