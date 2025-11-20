import { db } from '../../src/config/prisma';
import { buildLogger } from '../../src/utils';
import type { BackofficeAccountData, UserForMigration } from '../types';
import { generateDeviceId } from '../utils';

const logger = buildLogger('DatabaseService');

/**
 * Saves the backoffice profile data to the database
 * @param userId - User ID
 * @param backofficeData - Account data from backoffice API
 */
export async function saveBackofficeProfile(
  userId: number,
  backofficeData: BackofficeAccountData
): Promise<void> {
  logger.info(`Saving backoffice profile for userId: ${userId}`);

  try {
    await db.backofficeCustomerProfile.upsert({
      where: { userId },
      create: {
        userId,
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
      },
      update: {
        account_level: backofficeData.account_level,
        account_status: backofficeData.account_status,
        account_status_string: backofficeData.account_status_string,
        external_customer_id: backofficeData.id,
        oauth_token: backofficeData.oauth_token,
        refresh_token: backofficeData.refresh_token,
        private_key: backofficeData.private_key,
        ewallet_id: backofficeData.ewallet_id,
        ewallet_status: backofficeData.ewallet_status,
        updatedAt: new Date(),
      },
    });

    logger.info(`Backoffice profile saved successfully for userId: ${userId}`);
  } catch (error) {
    logger.error(`Failed to save backoffice profile for userId: ${userId}:`, {
      error,
    });
    throw error;
  }
}

/**
 * Saves the authentication state data to the database
 * @param userId - User ID
 * @param backofficeData - Account data from backoffice API
 */
export async function saveAuthState(
  userId: number,
  backofficeData: BackofficeAccountData
): Promise<void> {
  logger.info(`Saving auth state for userId: ${userId}`);

  try {
    await db.backofficeAuthState.upsert({
      where: { userId },
      create: {
        userId,
        clientState: 9, // default
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
      },
      update: {
        privateKey: backofficeData.private_key,
        refreshToken: backofficeData.refresh_token,
        lastCustomerOauthToken: backofficeData.oauth_token,
        externalCustomerId: backofficeData.id,
        ewalletId: backofficeData.ewallet_id,
        updatedAt: new Date(),
      },
    });

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
 * @param userId - User ID to check
 * @returns True if profile exists, false otherwise
 */
export async function hasExistingProfile(userId: number): Promise<boolean> {
  try {
    const existingProfile = await db.backofficeCustomerProfile.findUnique({
      where: { userId },
    });
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
 * @param targetUserId - Optional specific user ID to migrate
 * @returns Array of users for migration
 */
export async function getUsersForMigration(
  targetUserId?: number
): Promise<UserForMigration[]> {
  try {
    if (targetUserId) {
      const user = await db.users.findUnique({
        where: { id: targetUserId },
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

      if (!user) {
        throw new Error(`User with ID ${targetUserId} not found`);
      }

      return [user];
    }

    // Return all users if no specific ID provided
    return await db.users.findMany({
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
  } catch (error) {
    logger.error('Failed to retrieve users for migration:', { error });
    throw error;
  }
}
