/**
 * @fileoverview Repository for managing user backoffice data persistence
 * @description Handles database operations for backoffice customer profiles and authentication states
 */

import { db } from '../../src/config/prisma';
import type {
  CustomerProfileCreateData,
  CustomerProfileUpdateData,
  AuthenticationStateCreateData,
  AuthenticationStateUpdateData,
  CustomerProfileData,
  UserMigrationData,
} from '../schemas';

/**
 * Repository class for managing user backoffice data in the database
 * Provides methods for CRUD operations on backoffice customer profiles and authentication states
 */
export class CustomerProfileRepository {
  /**
   * Creates or updates a user's backoffice customer profile
   * @param userId - The unique identifier of the user
   * @param createData - Data to use when creating a new profile
   * @param updateData - Data to use when updating an existing profile
   */
  async upsertProfile(
    userId: number,
    createData: CustomerProfileCreateData,
    updateData: CustomerProfileUpdateData
  ): Promise<CustomerProfileData> {
    return db.backofficeCustomerProfile.upsert({
      where: { userId },
      create: createData,
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        external_customer_id: true,
        account_level: true,
        account_status: true,
        oauth_token: true,
        private_key: true,
        refresh_token: true,
        ewallet_id: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Creates or updates a user's backoffice authentication state
   * @param userId - The unique identifier of the user
   * @param createData - Data to use when creating a new auth state
   * @param updateData - Data to use when updating an existing auth state
   */
  async upsertAuthState(
    userId: number,
    createData: AuthenticationStateCreateData,
    updateData: AuthenticationStateUpdateData
  ) {
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
   */
  async findProfileByUserId(
    userId: number
  ): Promise<CustomerProfileData | null> {
    const profile = await db.backofficeCustomerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        external_customer_id: true,
        account_level: true,
        account_status: true,
        oauth_token: true,
        private_key: true,
        refresh_token: true,
        ewallet_id: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return profile;
  }

  /**
   * Finds a user by ID with selected fields for migration
   * @param userId - The unique identifier of the user
   */
  async findUserById(userId: number): Promise<UserMigrationData | null> {
    return await db.users.findUnique({
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
   */
  async findAllUsers(): Promise<UserMigrationData[]> {
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
