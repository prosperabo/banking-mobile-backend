import { db } from '../src/config/prisma';
import backOfficeInstance from '../src/api/backoffice.instance';
import { buildLogger } from '../src/utils';
import type { Users } from '@prisma/client';
import FormData from 'form-data';
import crypto from 'crypto';

const logger = buildLogger('MigrateUsersScript');

type UserForMigration = Pick<
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

interface CreateAccountResponse {
  ss?: {
    account_level: number;
    account_status: number;
    account_status_string: string;
    address: string;
    address_document_back: string;
    address_document_back_url: string;
    address_document_front: string;
    address_document_front_url: string;
    address_document_type: number;
    are_account_resources_of_user: boolean;
    business_name: string;
    business_purpose: string;
    ciabe: string;
    city: string;
    colony: string;
    constitution_date: string;
    correspondence_address: string;
    country_of_birth: string;
    date_of_birth: string;
    ecommerce_id: number;
    email: string;
    exterior: string;
    first_name: string;
    gender: number;
    gender_string: string;
    id: number;
    identification_document_back: string;
    identification_document_back_url: string;
    identification_document_front: string;
    identification_document_front_url: string;
    identification_document_type: number;
    interior: string;
    is_business: boolean;
    last_name: string;
    mobile: string;
    mobile_country_code: string;
    nationality_id: number;
    oauth_token: string;
    occupation_id: number;
    person_type: number;
    private_key: string;
    rfc: string;
    refresh_token: string;
    risk_level: number;
    second_last_name: string;
    society_type: number;
    selfie: string;
    selfie_url: string;
    state_id: number;
    street: string;
    telephone: string;
    zipcode: string;
    ewallet_id: number;
    ewallet_status: number;
  };
  rs?: {
    account_level: number;
    account_status: number;
    account_status_string: string;
    address: string;
    address_document_back: string;
    address_document_back_url: string;
    address_document_front: string;
    address_document_front_url: string;
    address_document_type: number;
    are_account_resources_of_user: boolean;
    business_name: string;
    business_purpose: string;
    ciabe: string;
    city: string;
    colony: string;
    constitution_date: string;
    correspondence_address: string;
    country_of_birth: string;
    date_of_birth: string;
    ecommerce_id: number;
    email: string;
    exterior: string;
    first_name: string;
    gender: number;
    gender_string: string;
    id: number;
    identification_document_back: string;
    identification_document_back_url: string;
    identification_document_front: string;
    identification_document_front_url: string;
    identification_document_type: number;
    interior: string;
    is_business: boolean;
    last_name: string;
    mobile: string;
    mobile_country_code: string;
    nationality_id: number;
    oauth_token: string;
    occupation_id: number;
    person_type: number;
    private_key: string;
    rfc: string;
    refresh_token: string;
    risk_level: number;
    second_last_name: string;
    society_type: number;
    selfie: string;
    selfie_url: string;
    state_id: number;
    street: string;
    telephone: string;
    zipcode: string;
    ewallet_id: number;
    ewallet_status: number;
  };
  err: null | string;
}

function mapGender(gender: string): number {
  return gender === 'MASCULINO' ? 2 : 1;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAccountIn123(user: UserForMigration) {
  logger.info(`Creating account in 123 for user: ${user.email}`);

  try {
    // Crear FormData para el request
    const formData = new FormData();
    formData.append('device_id', `device_${user.id}_${Date.now()}`);
    formData.append('email', user.email);
    formData.append(
      'first_name',
      user.completeName.split(' ')[0] || user.completeName
    );
    formData.append(
      'last_name',
      user.completeName.split(' ').slice(1).join(' ') || 'Apellido'
    );
    formData.append(
      'second_last_name',
      user.completeName.split(' ')[2] ||
        user.completeName.split(' ')[1] ||
        'Apellido 2'
    );
    formData.append('gender', mapGender(user.gender).toString());
    formData.append('kyc_level', '1');
    formData.append('mobile', user.phone || '5551234568');
    formData.append('password', hashPassword(user.password));
    formData.append('rfc', user.rfc || 'XAXX010101000');
    formData.append('campaign_id', 'SOF250820595');
    formData.append('credit_line', 1000000);

    // Mostrar por consola todo el formData
    logger.info('FormData contents:');
    logger.info(`FormData - device_id: device_${user.id}_${Date.now()}`);
    logger.info(`FormData - email: ${user.email}`);
    logger.info(
      `FormData - first_name: ${user.completeName.split(' ')[0] || user.completeName}`
    );
    logger.info(
      `FormData - last_name: ${user.completeName.split(' ').slice(1).join(' ') || 'Apellido'}`
    );
    logger.info(
      `FormData - second_last_name: ${user.completeName.split(' ')[2] || user.completeName.split(' ')[1] || 'Apellido 2'}`
    );
    logger.info(`FormData - gender: ${mapGender(user.gender).toString()}`);
    logger.info(`FormData - kyc_level: 1`);
    logger.info(`FormData - mobile: ${user.phone || '5555551234'}`);
    logger.info(`FormData - password: [SHA256 HASHED]`);
    logger.info(`FormData - rfc: ${user.rfc || 'XAXX010101000'}`);

    const response = await backOfficeInstance.post<CreateAccountResponse>(
      '/user/v1/account/create',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Normalizar respuesta: algunos endpoints devuelven `ss`, otros `rs`.
    const payload = (response.data as any).ss ?? (response.data as any).rs;

    if (!payload) {
      logger.error('Unexpected response format from backoffice:', {
        data: response.data,
      });
      throw new Error('Unexpected response format from backoffice');
    }

    logger.info(`Account created successfully for ${user.email}`, {
      externalCustomerId: payload.id,
    });

    // Devolver en la misma forma que el resto del código espera (ss)
    return {
      ss: payload,
      err: (response.data as any).err ?? null,
    } as CreateAccountResponse;
  } catch (error) {
    logger.error(`Failed to create account in 123 for ${user.email}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

async function saveBackofficeProfile(
  userId: number,
  backofficeData: NonNullable<CreateAccountResponse['ss']>
) {
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

async function saveAuthState(
  userId: number,
  backofficeData: NonNullable<CreateAccountResponse['ss']>
) {
  logger.info(`Saving auth state for userId: ${userId}`);

  try {
    await db.backofficeAuthState.upsert({
      where: { userId },
      create: {
        userId,
        clientState: 9, // default
        deviceId: `device_${userId}_${Date.now()}`,
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

async function processUser(user: UserForMigration) {
  logger.info(`Processing user: ${user.email} (ID: ${user.id})`);

  try {
    const existingProfile = await db.backofficeCustomerProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      logger.warn(
        `User ${user.email} already has a backoffice profile. Skipping...`
      );
      return {
        success: false,
        reason: 'already_exists',
        user: user.email,
      };
    }

    const accountResponse = await createAccountIn123(user);

    if (accountResponse.err) {
      throw new Error(`123 API Error: ${accountResponse.err}`);
    }

    // Normalizar respuesta a un objeto seguro (algunos envían `ss`, otros `rs`)
    const backofficeData =
      (accountResponse as any).ss ?? (accountResponse as any).rs;

    if (!backofficeData) {
      throw new Error('Backoffice response missing account data');
    }

    await saveBackofficeProfile(user.id, backofficeData);

    await saveAuthState(user.id, backofficeData);

    logger.info(`User ${user.email} migrated successfully!`);

    return {
      success: true,
      user: user.email,
      externalCustomerId: accountResponse.ss.id,
    };
  } catch (error) {
    logger.error(`Failed to process user ${user.email}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
      user: user.email,
    };
  }
}

async function migrateUsers() {
  logger.info('Starting user migration to 123 backoffice...\n');

  try {
    // Comentado: Obtención masiva de usuarios
    // const users = await db.users.findMany({
    //   select: {
    //     id: true,
    //     email: true,
    //     password: true,
    //     phone: true,
    //     completeName: true,
    //     gender: true,
    //     birthDate: true,
    //     birthCountry: true,
    //     curp: true,
    //     postalCode: true,
    //     state: true,
    //     country: true,
    //     municipality: true,
    //     street: true,
    //     colony: true,
    //     externalNumber: true,
    //     internalNumber: true,
    //     rfc: true,
    //   },
    // });

    // Solo procesar usuario con ID 37 para pruebas
    const targetUser = await db.users.findUnique({
      where: { id: 46 },
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

    if (!targetUser) {
      logger.error('User with ID 37 not found');
      throw new Error('User with ID 37 not found');
    }

    const users = [targetUser]; // Array con solo el usuario ID 37

    logger.info(`Found ${users.length} user to process (ID: 37)\n`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      const result = await processUser(user);
      results.push(result);

      if (result.success) {
        successCount++;
      } else if (result.reason === 'already_exists') {
        skippedCount++;
      } else {
        failureCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`Successful: ${successCount}`);
    logger.info(`Skipped (already exists): ${skippedCount}`);
    logger.info(`Failed: ${failureCount}`);

    logger.info('\n Migration completed!');
  } catch (error) {
    logger.error('Fatal error during migration:', { error });
    throw error;
  } finally {
    await db.$disconnect();
  }
}

migrateUsers()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    logger.error('Migration failed:', { error });
    process.exit(1);
  });
