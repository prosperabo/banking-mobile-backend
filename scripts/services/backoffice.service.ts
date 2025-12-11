import FormData from 'form-data';
import backOfficeInstance from '../../src/api/backoffice.instance';
import { buildLogger } from '../../src/utils';
import type { UserForMigration, CreateAccountResponse } from '../schemas';
import { mapGender, parseCompleteName } from '../utils/format.utils';
import { hashPassword, generateDeviceId } from '../utils/auth.utils';
import { preValidateBackofficeData } from '../utils/validation.utils';
import { BackofficeErrorHandler } from '../utils/error-handler.utils';

const logger = buildLogger('BackofficeIntegrationService');

/**
 * Service for handling 123 backoffice API interactions
 */
export class UserBackofficeService {
  /**
   * Creates a new account in the 123 backoffice system
   * @param userData - User data for migration
   * @returns Account creation response
   */
  async createCustomerAccount(userData: UserForMigration): Promise<CreateAccountResponse> {
    // Pre-validate and correct user data
    const validation = preValidateBackofficeData(userData);

    if (!validation || !validation.isValid) {
      const errors = validation?.errors || ['Unknown validation error'];
      logger.error(`Pre-validation failed for ${userData.email}:`, { errors });
      return {
        ss: undefined,
        rs: undefined,
        err: `Validation failed: ${errors.join(', ')}`,
      };
    }

    if (validation.warnings && validation.warnings.length > 0) {
      // Data corrections applied silently
    }

    const correctedUserData = validation.correctedData || userData;
    const deviceId = generateDeviceId(correctedUserData.id);
    const { firstName, lastName, secondLastName } = parseCompleteName(
      correctedUserData.completeName
    );

      // Validate required fields before sending
      const requiredFields = {
        device_id: deviceId,
        email: correctedUserData.email,
        first_name: firstName,
        last_name: lastName,
        gender: correctedUserData.gender,
        mobile: correctedUserData.phone,
        password: correctedUserData.password,
        rfc: correctedUserData.rfc,
      };

      // Check for missing or invalid required fields
      const missingFields = Object.entries(requiredFields)
        .filter(([_key, value]) => !value || value.toString().trim() === '')
        .map(([key]) => key);

      if (missingFields.length > 0) {
        logger.error(`Missing required fields for ${correctedUserData.email}:`, {
          missingFields,
          currentData: requiredFields,
        });
        return {
          ss: undefined,
          rs: undefined,
          err: `Missing required fields: ${missingFields.join(', ')}`,
        };
      }

      // Create FormData for the request
      const formData = new FormData();
      formData.append('device_id', deviceId);
      formData.append('email', correctedUserData.email);
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('second_last_name', secondLastName || '');
      formData.append('gender', mapGender(correctedUserData.gender).toString());
      formData.append('kyc_level', '1');
      formData.append('mobile', correctedUserData.phone);
      formData.append('password', hashPassword(correctedUserData.password));
      formData.append('rfc', correctedUserData.rfc);
      formData.append('campaign_id', 'SOF250820595');
      formData.append('credit_line', '1000000');

    // Send request to backoffice
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

    // Return successful response
    return {
      ss: payload,
      err: response.data.err ?? null,
    } as CreateAccountResponse;
  }
}
