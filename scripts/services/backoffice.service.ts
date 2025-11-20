import FormData from 'form-data';
import backOfficeInstance from '../../src/api/backoffice.instance';
import { buildLogger } from '../../src/utils';
import type { UserForMigration, CreateAccountResponse } from '../types';
import {
  mapGender,
  hashPassword,
  generateDeviceId,
  parseCompleteName,
} from '../utils';

const logger = buildLogger('BackofficeService');

/**
 * Creates a new account in the 123 backoffice system
 * @param user - User data for migration
 * @returns Promise with account creation response
 */
export async function createAccountIn123(
  user: UserForMigration
): Promise<CreateAccountResponse> {
  logger.info(`Creating account in 123 for user: ${user.email}`);

  try {
    const deviceId = generateDeviceId(user.id);
    const { firstName, lastName, secondLastName } = parseCompleteName(
      user.completeName
    );

    // Create FormData for the request
    const formData = new FormData();
    formData.append('device_id', deviceId);
    formData.append('email', user.email);
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('second_last_name', secondLastName);
    formData.append('gender', mapGender(user.gender).toString());
    formData.append('kyc_level', '1');
    formData.append('mobile', user.phone || '5551234568');
    formData.append('password', hashPassword(user.password));
    formData.append('rfc', user.rfc || 'XAXX010101000');
    formData.append('campaign_id', 'SOF250820595');
    formData.append('credit_line', '1000000');

    // Log FormData contents for debugging
    logger.info('FormData contents:', {
      device_id: deviceId,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      second_last_name: secondLastName,
      gender: mapGender(user.gender),
      kyc_level: 1,
      mobile: user.phone || '5551234568',
      password: '[SHA256 HASHED]',
      rfc: user.rfc || 'XAXX010101000',
    });

    const response = await backOfficeInstance.post<CreateAccountResponse>(
      '/user/v1/account/create',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Normalize response: some endpoints return `ss`, others `rs`
    const payload = response.data.ss ?? response.data.rs;

    if (!payload) {
      logger.error('Unexpected response format from backoffice:', {
        data: response.data,
      });
      throw new Error('Unexpected response format from backoffice');
    }

    logger.info(`Account created successfully for ${user.email}`, {
      externalCustomerId: payload.id,
    });

    // Return in the same format the rest of the code expects (ss)
    return {
      ss: payload,
      err: response.data.err ?? null,
    } as CreateAccountResponse;
  } catch (error) {
    logger.error(`Failed to create account in 123 for ${user.email}:`, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
