/**
 * @fileoverview User service for managing backoffice user profiles and authentication state
 * @description Handles CRUD operations for user data in the 123 Backoffice system integration
 */

import { buildLogger } from '../../src/utils';
import type {
  BackofficeAccountData,
  UserForMigration,
  CustomerProfileCreateData,
  CustomerProfileUpdateData,
  AuthenticationStateCreateData,
  AuthenticationStateUpdateData,
} from '../schemas';
import { generateDeviceId } from '../utils/auth.utils';
import { CustomerProfileRepository } from '../repositories/user-backoffice.repository';

const logger = buildLogger('CustomerProfileService');

/**
 * Service class for managing user backoffice profiles and authentication data
 * Provides methods to save, retrieve, and manage user data for 123 Backoffice integration
 */
export class CustomerProfileService {
  private readonly profileRepository: CustomerProfileRepository;

  constructor() {
    this.profileRepository = new CustomerProfileRepository();
  }

  /**
   * Saves the backoffice profile data to the database
   * @param userId - The unique identifier of the user
   * @param accountData - Account data retrieved from the backoffice API
   */
  async saveCustomerProfile(
    userId: number,
    accountData: BackofficeAccountData
  ): Promise<void> {
    logger.info(`Saving backoffice profile for userId: ${userId}`);

    // Prepare profile data for creation
    const profileCreateData: CustomerProfileCreateData = {
      Users: { connect: { id: userId } },
      account_level: accountData.account_level,
      account_status: accountData.account_status,
      account_status_string: accountData.account_status_string,
      address: accountData.address,
      address_document_back: accountData.address_document_back,
      address_document_back_url: accountData.address_document_back_url,
      address_document_front: accountData.address_document_front,
      address_document_front_url: accountData.address_document_front_url,
      address_document_type: accountData.address_document_type,
      are_account_resources_of_user: accountData.are_account_resources_of_user,
      business_name: accountData.business_name,
      business_purpose: accountData.business_purpose,
      ciabe: accountData.ciabe,
      city: accountData.city,
      colony: accountData.colony,
      constitution_date: accountData.constitution_date,
      correspondence_address: accountData.correspondence_address,
      country_of_birth: accountData.country_of_birth,
      date_of_birth: accountData.date_of_birth,
      ecommerce_id: accountData.ecommerce_id,
      email: accountData.email,
      exterior: accountData.exterior,
      first_name: accountData.first_name,
      gender: accountData.gender,
      gender_string: accountData.gender_string,
      external_customer_id: accountData.id,
      identification_document_back: accountData.identification_document_back,
      identification_document_back_url: accountData.identification_document_back_url,
      identification_document_front: accountData.identification_document_front,
      identification_document_front_url: accountData.identification_document_front_url,
      identification_document_type: accountData.identification_document_type,
      interior: accountData.interior,
      is_business: accountData.is_business,
      last_name: accountData.last_name,
      mobile: accountData.mobile ? String(accountData.mobile) : null,
      mobile_country_code: accountData.mobile_country_code,
      nationality_id: accountData.nationality_id,
      oauth_token: accountData.oauth_token,
      occupation_id: accountData.occupation_id,
      person_type: accountData.person_type,
      private_key: accountData.private_key,
      rfc: accountData.rfc,
      refresh_token: accountData.refresh_token,
      risk_level: accountData.risk_level,
      second_last_name: accountData.second_last_name,
      society_type: accountData.society_type,
      selfie: accountData.selfie,
      selfie_url: accountData.selfie_url,
      state_id: accountData.state_id,
      street: accountData.street,
      telephone: accountData.telephone,
      zipcode: accountData.zipcode,
      ewallet_id: accountData.ewallet_id,
      ewallet_status: accountData.ewallet_status,
    };

    // Prepare update data for existing profiles
    const profileUpdateData: CustomerProfileUpdateData = {
      account_level: accountData.account_level,
      account_status: accountData.account_status,
      account_status_string: accountData.account_status_string,
      external_customer_id: accountData.id,
      oauth_token: accountData.oauth_token,
      refresh_token: accountData.refresh_token,
      private_key: accountData.private_key,
      ewallet_id: accountData.ewallet_id,
      ewallet_status: accountData.ewallet_status,
    };

    await this.profileRepository.upsertProfile(
      userId,
      profileCreateData,
      profileUpdateData
    );

    logger.info(
      `Backoffice profile saved successfully for userId: ${userId}`
    );
  }

  /**
   * Saves the authentication state data to the database
   * @param userId - The unique identifier of the user
   * @param accountData - Account data retrieved from the backoffice API
   */
  async saveAuthenticationState(
    userId: number,
    accountData: BackofficeAccountData
  ): Promise<void> {
    logger.info(`Saving auth state for userId: ${userId}`);

    // Prepare auth state data for creation
    const authCreateData: AuthenticationStateCreateData = {
      Users: { connect: { id: userId } },
      clientState: 9, // Default client state
      deviceId: generateDeviceId(userId),
      privateKey: accountData.private_key,
      refreshToken: accountData.refresh_token,
      extraLoginData: JSON.stringify({
        email: accountData.email,
        mobile: accountData.mobile,
      }),
      lastCustomerOauthToken: accountData.oauth_token,
      oauthExpirationTimestamp: null,
      refreshExpirationTimestamp: null,
      externalCustomerId: accountData.id,
      ewalletId: accountData.ewallet_id,
      defaultBalanceId: null,
      lastCardId: null,
    };

    // Prepare update data for existing auth states
    const authUpdateData: AuthenticationStateUpdateData = {
      privateKey: accountData.private_key,
      refreshToken: accountData.refresh_token,
      lastCustomerOauthToken: accountData.oauth_token,
      externalCustomerId: accountData.id,
      ewalletId: accountData.ewallet_id,
    };

    await this.profileRepository.upsertAuthState(
      userId,
      authCreateData,
      authUpdateData
    );

    logger.info(`Auth state saved successfully for userId: ${userId}`);
  }

  /**
   * Checks if a user already has a backoffice profile
   * @param userId - The unique identifier of the user to check
   * @returns Promise resolving to true if profile exists, false otherwise
   */
  async hasExistingCustomerProfile(userId: number): Promise<boolean> {
    const existingProfile = await this.profileRepository.findProfileByUserId(userId);
    return !!existingProfile;
  }

  /**
   * Retrieves users for migration based on criteria
   * @returns Promise resolving to an array of users ready for migration
   */
  async getUsersForMigration(): Promise<UserForMigration[]> {
    // Get all users first
    const allUsers = await this.profileRepository.findAllUsers();

    // Filter out users that already have backoffice profiles
    const usersWithoutProfiles: UserForMigration[] = [];

    for (const user of allUsers) {
      const hasProfile = await this.hasExistingCustomerProfile(user.id);
      if (!hasProfile) {
        usersWithoutProfiles.push(user);
      }
    }

    logger.info(
      `Found ${usersWithoutProfiles.length} users without backoffice profiles out of ${allUsers.length} total users`
    );

    return usersWithoutProfiles;
  }
}
