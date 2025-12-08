/**
 * @fileoverview User service for managing backoffice user profiles and authentication state
 * @description Handles CRUD operations for user data in the 123 Backoffice system integration
 */

import { buildLogger } from '../../src/utils';
import type { BackofficeAccountData } from '../schemas/backoffice.schema';
import type { UserForMigration } from '../schemas/migration.schema';
import { generateDeviceId } from '../utils/auth.utils';
import { UserBackofficeRepository } from '../repositories/user-backoffice.repository';
import type { Prisma } from '@prisma/client';

const logger = buildLogger('UserService');

/**
 * Service class for managing user backoffice profiles and authentication data
 * Provides methods to save, retrieve, and manage user data for 123 Backoffice integration
 */
export class UserService {
  private readonly backofficeRepository: UserBackofficeRepository;

  constructor() {
    this.backofficeRepository = new UserBackofficeRepository();
  }

  /**
   * Saves the backoffice profile data to the database
   * @param userId - The unique identifier of the user
   * @param backofficeData - Account data retrieved from the backoffice API
   * @throws {Error} When the profile cannot be saved to the database
   */
  async saveBackofficeProfile(
    userId: number,
    backofficeData: BackofficeAccountData
  ): Promise<void> {
    logger.info(`Saving backoffice profile for userId: ${userId}`);

    try {
      // Type-safe profile data for creation
      const createData: Prisma.BackofficeCustomerProfileCreateInput = {
        Users: { connect: { id: userId } },
        account_level: backofficeData.account_level,
        account_status: backofficeData.account_status,
        account_status_string: backofficeData.account_status_string,
        address: backofficeData.address,
        address_document_back: backofficeData.address_document_back,
        address_document_back_url: backofficeData.address_document_back_url,
        address_document_front: backofficeData.address_document_front,
        address_document_front_url: backofficeData.address_document_front_url,
        address_document_type: backofficeData.address_document_type,
        are_account_resources_of_user:
          backofficeData.are_account_resources_of_user,
        business_name: backofficeData.business_name,
        business_purpose: backofficeData.business_purpose,
        ciabe: backofficeData.ciabe,
        city: backofficeData.city,
        colony: backofficeData.colony,
        constitution_date: backofficeData.constitution_date,
        correspondence_address: backofficeData.correspondence_address,
        country_of_birth: backofficeData.country_of_birth,
        date_of_birth: backofficeData.date_of_birth,
        ecommerce_id: backofficeData.ecommerce_id,
        email: backofficeData.email,
        exterior: backofficeData.exterior,
        first_name: backofficeData.first_name,
        gender: backofficeData.gender,
        gender_string: backofficeData.gender_string,
        external_customer_id: backofficeData.id,
        identification_document_back:
          backofficeData.identification_document_back,
        identification_document_back_url:
          backofficeData.identification_document_back_url,
        identification_document_front:
          backofficeData.identification_document_front,
        identification_document_front_url:
          backofficeData.identification_document_front_url,
        identification_document_type:
          backofficeData.identification_document_type,
        interior: backofficeData.interior,
        is_business: backofficeData.is_business,
        last_name: backofficeData.last_name,
        mobile: backofficeData.mobile,
        mobile_country_code: backofficeData.mobile_country_code,
        nationality_id: backofficeData.nationality_id,
        oauth_token: backofficeData.oauth_token,
        occupation_id: backofficeData.occupation_id,
        person_type: backofficeData.person_type,
        private_key: backofficeData.private_key,
        rfc: backofficeData.rfc,
        refresh_token: backofficeData.refresh_token,
        risk_level: backofficeData.risk_level,
        second_last_name: backofficeData.second_last_name,
        society_type: backofficeData.society_type,
        selfie: backofficeData.selfie,
        selfie_url: backofficeData.selfie_url,
        state_id: backofficeData.state_id,
        street: backofficeData.street,
        telephone: backofficeData.telephone,
        zipcode: backofficeData.zipcode,
        ewallet_id: backofficeData.ewallet_id,
        ewallet_status: backofficeData.ewallet_status,
      };

      // Update data for existing profiles
      const updateData: Prisma.BackofficeCustomerProfileUpdateInput = {
        account_level: backofficeData.account_level,
        account_status: backofficeData.account_status,
        account_status_string: backofficeData.account_status_string,
        external_customer_id: backofficeData.id,
        oauth_token: backofficeData.oauth_token,
        refresh_token: backofficeData.refresh_token,
        private_key: backofficeData.private_key,
        ewallet_id: backofficeData.ewallet_id,
        ewallet_status: backofficeData.ewallet_status,
      };

      await this.backofficeRepository.upsertProfile(
        userId,
        createData,
        updateData
      );

      logger.info(
        `Backoffice profile saved successfully for userId: ${userId}`
      );
    } catch (error) {
      logger.error(`Failed to save backoffice profile for userId: ${userId}:`, {
        error,
      });
      throw error;
    }
  }

  /**
   * Saves the authentication state data to the database
   * @param userId - The unique identifier of the user
   * @param backofficeData - Account data retrieved from the backoffice API
   * @throws {Error} When the authentication state cannot be saved to the database
   */
  async saveAuthState(
    userId: number,
    backofficeData: BackofficeAccountData
  ): Promise<void> {
    logger.info(`Saving auth state for userId: ${userId}`);

    try {
      // Type-safe auth state data for creation
      const createData: Prisma.BackofficeAuthStateCreateInput = {
        Users: { connect: { id: userId } },
        clientState: 9, // Default client state
        deviceId: generateDeviceId(userId),
        privateKey: backofficeData.private_key,
        refreshToken: backofficeData.refresh_token,
        extraLoginData: JSON.stringify({
          email: backofficeData.email,
          mobile: backofficeData.mobile,
        }),
        lastCustomerOauthToken: backofficeData.oauth_token,
        oauthExpirationTimestamp: null,
        refreshExpirationTimestamp: null,
        externalCustomerId: backofficeData.id,
        ewalletId: backofficeData.ewallet_id,
        defaultBalanceId: null,
        lastCardId: null,
      };

      // Update data for existing auth states
      const updateData: Prisma.BackofficeAuthStateUpdateInput = {
        privateKey: backofficeData.private_key,
        refreshToken: backofficeData.refresh_token,
        lastCustomerOauthToken: backofficeData.oauth_token,
        externalCustomerId: backofficeData.id,
        ewalletId: backofficeData.ewallet_id,
      };

      await this.backofficeRepository.upsertAuthState(
        userId,
        createData,
        updateData
      );

      logger.info(`Auth state saved successfully for userId: ${userId}`);
    } catch (error) {
      logger.error(`Failed to save auth state for userId: ${userId}:`, {
        error,
      });
      throw error;
    }
  }

  /**
   * Checks if a user already has a backoffice profile
   * @param userId - The unique identifier of the user to check
   * @returns Promise resolving to true if profile exists, false otherwise
   * @throws {Error} When the database query fails
   */
  async hasExistingProfile(userId: number): Promise<boolean> {
    try {
      const existingProfile =
        await this.backofficeRepository.findProfileByUserId(userId);
      return !!existingProfile;
    } catch (error) {
      logger.error(`Failed to check existing profile for userId: ${userId}:`, {
        error,
      });
      throw error;
    }
  }

  /**
   * Retrieves users for migration based on criteria
   * @param targetUserId - Optional specific user ID to migrate. If not provided, all users without profiles are returned
   * @returns Promise resolving to an array of users ready for migration
   * @throws {Error} When the user query fails or target user is not found
   */
  async getUsersForMigration(
    targetUserId?: number
  ): Promise<UserForMigration[]> {
    try {
      if (targetUserId) {
        const user = await this.backofficeRepository.findUserById(targetUserId);

        if (!user) {
          throw new Error(`User with ID ${targetUserId} not found`);
        }

        return [user];
      }

      // Get all users first
      const allUsers = await this.backofficeRepository.findAllUsers();

      // Filter out users that already have backoffice profiles
      const usersWithoutProfiles: UserForMigration[] = [];

      for (const user of allUsers) {
        const hasProfile = await this.hasExistingProfile(user.id);
        if (!hasProfile) {
          usersWithoutProfiles.push(user);
        }
      }

      logger.info(
        `Found ${usersWithoutProfiles.length} users without backoffice profiles out of ${allUsers.length} total users`
      );

      return usersWithoutProfiles;
    } catch (error) {
      logger.error('Failed to retrieve users for migration:', { error });
      throw error;
    }
  }
}
