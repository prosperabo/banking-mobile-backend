/**
 * @fileoverview Service for 123 Backoffice API integration
 * @description Handles communication with external backoffice system
 */

import { buildLogger } from '@/utils';
import { config } from '@/config';
import {
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
  ClabeBackofficeResponse,
  UserBackofficeResponse,
  BackofficeCreateAccountData,
  BackofficeApiResponse,
  BackofficeAccountResponse,
} from '@/schemas';
import backOfficeInstance from '@/api/backoffice.instance';
import FormData from 'form-data';

const logger = buildLogger('backoffice-service');

export class BackofficeService {
  private static readonly BASE_URL = config.backofficeBaseUrl;
  private static readonly OAUTH_ENDPOINT = '/oauth/v1';
  private static readonly API_KEY = config.backofficeBaseUrl || ''; // Usando backofficeBaseUrl como fallback

  static async getCustomerConnectionToken(
    loginData: BackofficeLoginRequest
  ): Promise<BackofficeLoginResponse> {
    try {
      logger.info('Getting customer connection token from backoffice', {
        customer_id: loginData.customer_id,
      });

      const response = await fetch(
        `${this.BASE_URL}${this.OAUTH_ENDPOINT}/get-customer-connection-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginData),
        }
      );

      if (!response.ok) {
        logger.error('Non-ok response refreshing customer token', {
          ...response,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as BackofficeLoginResponse;
      logger.info('Successfully retrieved customer connection token');
      return data;
    } catch (error) {
      logger.error('Error getting customer connection token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Error connecting to backoffice system');
    }
  }

  static async refreshCustomerToken(
    refreshData: BackofficeRefreshRequest
  ): Promise<BackofficeRefreshResponse> {
    try {
      logger.info('Refreshing customer token from backoffice');

      const response = await fetch(
        `${this.BASE_URL}${this.OAUTH_ENDPOINT}/refresh-customer-connection-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refreshData),
        }
      );

      if (!response.ok) {
        logger.error('Non-ok response refreshing customer token', {
          ...response,
        });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as BackofficeRefreshResponse;
      logger.info('Successfully refreshed customer token');
      return data;
    } catch (error) {
      logger.error('Error refreshing customer token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Error refreshing backoffice token');
    }
  }

  /**
   * Creates a new customer account in 123 Backoffice system
   * @param userData - Account creation data
   * @returns Promise resolving to API response
   */
  static async createAccountIn123(
    userData: BackofficeCreateAccountData
  ): Promise<BackofficeApiResponse> {
    logger.info('Creating account in 123 backoffice', {
      email: userData.email,
    });

    // Build multipart/form-data using FormData and use shared axios instance
    const form = new FormData();

    const firstName = userData.firstName;
    const lastName = userData.lastName;
    const secondLastName = userData.secondLastName;
    const genderRaw = userData.gender ?? 'MASCULINO';

    // Map gender from enum/string to API numeric values: 1=female,2=male,3=other
    let genderValue = '2';
    if (String(genderRaw).toUpperCase().includes('FEM')) genderValue = '1';
    else if (String(genderRaw).toUpperCase().includes('MASC'))
      genderValue = '2';
    else genderValue = '3';

    form.append('device_id', userData.device_id);
    form.append('email', userData.email);
    form.append('password', userData.password);
    if (firstName) form.append('first_name', firstName);
    if (userData.middleName) form.append('middle_name', userData.middleName);
    if (lastName) form.append('last_name', lastName);
    if (secondLastName) form.append('second_last_name', secondLastName);
    form.append('kyc_level', '1');
    form.append('gender', genderValue);
    if (userData.phone) form.append('mobile', String(userData.phone));
    if (userData.countryCode)
      form.append('mobile_country_code', String(userData.countryCode));
    if (userData.rfc) form.append('rfc', String(userData.rfc));
    if (userData.postalCode)
      form.append('zipcode', String(userData.postalCode));

    form.append('campaign_id', config.campaing.campaign_id);
    form.append('credit_line', config.campaing.creditLine);

    const headers = {
      ...form.getHeaders(),
    };

    type BackofficeRawResponse = {
      err?: string;
      rs?: BackofficeAccountResponse;
      [key: string]: unknown;
    };

    const response = await backOfficeInstance.post<BackofficeRawResponse>(
      '/user/v1/account/create',
      form,
      { headers }
    );

    const responseData = response.data;
    const result = responseData?.rs ?? responseData;
    logger.info('Successfully created account in 123 backoffice');
    return result as BackofficeApiResponse;
  }

  static async getSpeiClabe(customerToken: string): Promise<string> {
    logger.info('Getting SPEI CLABE from backoffice', {
      customerToken,
    });

    const response = await backOfficeInstance.get<ClabeBackofficeResponse>(
      '/user/v1/account/spei-clabe',
      {
        headers: {
          'Authorization-customer': customerToken,
          'Authorization-ecommerce': config.ecommerceToken,
          Client: 'customer',
        },
      }
    );

    logger.info('Successfully retrieved SPEI CLABE from backoffice');
    return response.data.rs.spei_clabe;
  }

  static async getUserInfo(
    customerId: number
  ): Promise<UserBackofficeResponse> {
    logger.info('Getting user info from backoffice', {
      customerId,
    });

    const response = await backOfficeInstance.get<UserBackofficeResponse>(
      `/user/v1/account/${customerId}`
    );

    logger.info('Successfully retrieved user info from backoffice');
    return response.data;
  }
}
