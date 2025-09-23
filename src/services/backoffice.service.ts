import { buildLogger } from '@/shared/utils';
import { config } from '@/config';
import {
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
} from '@/types';

const logger = buildLogger('backoffice-service');

export class BackofficeService {
  private static readonly BASE_URL = config.backofficeBaseUrl;
  private static readonly OAUTH_ENDPOINT = '/oauth/v1';

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
            'Authorization-ecommerce': loginData.ecommerce_token,
          },
          body: JSON.stringify(loginData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Backoffice API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `Backoffice API error: ${response.status} ${response.statusText} :: ${errorText}`
        );
      }

      const data = await response.json();
      logger.info('Successfully obtained customer connection token');

      return data;
    } catch (error) {
      logger.error('Error getting customer connection token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Error comunicándose con el backoffice');
    }
  }

  static async refreshCustomerToken(
    refreshData: BackofficeRefreshRequest
  ): Promise<BackofficeRefreshResponse> {
    try {
      logger.info('Refreshing customer token from backoffice', {
        device_id: refreshData.device_id,
      });

      const response = await fetch(
        `${this.BASE_URL}${this.OAUTH_ENDPOINT}/refresh-customer-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(refreshData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Backoffice refresh API error', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `Backoffice refresh API error: ${response.status} ${response.statusText} :: ${errorText}`
        );
      }

      const data = await response.json();
      logger.info('Successfully refreshed customer token');
      return data;
    } catch (error) {
      logger.error('Error refreshing customer token', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Error refrescando token del backoffice');
    }
  }
}
