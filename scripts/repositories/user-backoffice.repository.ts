/**
 * @fileoverview Repository for managing user backoffice data persistence
 * @description Handles database operations for backoffice customer profiles and authentication states
 */

import { db } from '../../src/config/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Repository class for managing user backoffice data in the database
 * Provides methods for CRUD operations on backoffice customer profiles and authentication states
 */
export class UserBackofficeRepository {
  /**
   * Creates or updates a user's backoffice customer profile
   * @param userId - The unique identifier of the user
   * @param createData - Data to use when creating a new profile
   * @param updateData - Data to use when updating an existing profile
   * @returns Promise resolving to the upserted profile
   */
  async upsertProfile(
    userId: number,
    createData: Prisma.BackofficeCustomerProfileCreateInput,
    updateData: Prisma.BackofficeCustomerProfileUpdateInput
  ): Promise<Prisma.BackofficeCustomerProfileGetPayload<object>> {
    return db.backofficeCustomerProfile.upsert({
      where: { userId },
      create: createData,
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Creates or updates a user's backoffice authentication state
   * @param userId - The unique identifier of the user
   * @param createData - Data to use when creating a new auth state
   * @param updateData - Data to use when updating an existing auth state
   * @returns Promise resolving to the upserted authentication state
   */
  async upsertAuthState(
    userId: number,
    createData: Prisma.BackofficeAuthStateCreateInput,
    updateData: Prisma.BackofficeAuthStateUpdateInput
  ): Promise<Prisma.BackofficeAuthStateGetPayload<object>> {
    return db.backofficeAuthState.upsert({
      where: { userId },
      create: createData,
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Finds a backoffice customer profile by user ID
   * @param userId - The unique identifier of the user
   * @returns Promise resolving to the profile if found, null otherwise
   */
  async findProfileByUserId(
    userId: number
  ): Promise<Prisma.BackofficeCustomerProfileGetPayload<object> | null> {
    return db.backofficeCustomerProfile.findUnique({
      where: { userId },
    });
  }

  /**
   * Finds a user by ID with selected fields for migration
   * @param userId - The unique identifier of the user
   * @returns Promise resolving to the user data if found, null otherwise
   */
  async findUserById(userId: number): Promise<Prisma.UsersGetPayload<{
    select: {
      id: true;
      email: true;
      password: true;
      phone: true;
      completeName: true;
      gender: true;
      birthDate: true;
      birthCountry: true;
      curp: true;
      postalCode: true;
      state: true;
      country: true;
      municipality: true;
      street: true;
      colony: true;
      externalNumber: true;
      internalNumber: true;
      rfc: true;
    };
  }> | null> {
    return db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        phone: true,
        completeName: true,
        gender: true,
        birthDate: true,
        birthCountry: true,
        curp: true,
        postalCode: true,
        state: true,
        country: true,
        municipality: true,
        street: true,
        colony: true,
        externalNumber: true,
        internalNumber: true,
        rfc: true,
      },
    });
  }

  /**
   * Retrieves all users with selected fields for migration
   * @returns Promise resolving to an array of users with migration-relevant data
   */
  async findAllUsers(): Promise<
    Prisma.UsersGetPayload<{
      select: {
        id: true;
        email: true;
        password: true;
        phone: true;
        completeName: true;
        gender: true;
        birthDate: true;
        birthCountry: true;
        curp: true;
        postalCode: true;
        state: true;
        country: true;
        municipality: true;
        street: true;
        colony: true;
        externalNumber: true;
        internalNumber: true;
        rfc: true;
      };
    }>[]
  > {
    return db.users.findMany({
      select: {
        id: true,
        email: true,
        password: true,
        phone: true,
        completeName: true,
        gender: true,
        birthDate: true,
        birthCountry: true,
        curp: true,
        postalCode: true,
        state: true,
        country: true,
        municipality: true,
        street: true,
        colony: true,
        externalNumber: true,
        internalNumber: true,
        rfc: true,
      },
    });
  }
}
