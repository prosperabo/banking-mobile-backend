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
  BackofficeCreateAccountData,
  BackofficeApiResponse,
} from '@/schemas';

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
    try {
      logger.info('Creating account in 123 backoffice', {
        email: userData.email,
      });

      // Using URLSearchParams instead of FormData for better compatibility
      const formData = new URLSearchParams();
      formData.append('email', userData.email);
      formData.append('password', userData.password);
      formData.append('completeName', userData.completeName);
      formData.append('phone', userData.phone);

      const response = await fetch(`${this.BASE_URL}/api/v1/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer ${this.API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Backoffice API error: ${response.status} ${response.statusText} :: ${errorText}`
        );
      }

      const data = (await response.json()) as BackofficeApiResponse;
      logger.info('Successfully created account in 123 backoffice');
      return data;
    } catch (error) {
      logger.error('Error creating account in 123 backoffice', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { err: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
