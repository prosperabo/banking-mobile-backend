import {
  LoginRequest,
  LoginResponse,
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
  BackofficeUser,
} from '@/types';
import { buildLogger } from '@/shared/utils';
import { mockUserData } from '@/data/mock-user.data';
import { BackofficeService } from '@/services/backoffice.service';

const logger = buildLogger('auth-service');

export class AuthService {
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, password } = loginData;

      const user: BackofficeUser = mockUserData.rs;
      // const user: BackofficeUser = async getUserByEmail(email); // From DB with updated schema

      if (user.email !== email) {
        logger.warn('User not found', { email });
        throw new Error('Credenciales inválidas');
      }

      const mockPassword =
        '3f0daf3c8b48c259e4c3f8e69edfe8c34f255b7cb95bf66e85e8c596bffdf0a7';

      if (password !== mockPassword) {
        logger.warn('Invalid password', { userId: user.id });
        throw new Error('Credenciales inválidas');
      }
      const ecommerceToken = process.env.SANDBOX_TOKEN as string;
      const deviceId = '36489660967'; // TODO: Get this from device

      let connectionResp: BackofficeLoginResponse | undefined;
      try {
        const req: BackofficeLoginRequest = {
          client_state: 9,
          customer_id: user.id,
          customer_private_key: user.private_key,
          customer_refresh_token: user.refresh_token,
          device_id: deviceId,
          ecommerce_token: ecommerceToken,
          extra_login_data: '{"idAuth":1,"detail":"detail of login"}',
        };
        connectionResp =
          await BackofficeService.getCustomerConnectionToken(req);
      } catch {
        logger.error('Failed to obtain backoffice token');
      }

      if (!connectionResp || !connectionResp.response?.customer_oauth_token) {
        const refreshReq: BackofficeRefreshRequest = {
          customer_refresh_token: user.refresh_token,
          device_id: deviceId,
          ecommerce_token: ecommerceToken,
          extra_login_data: '{"idAuth":1,"detail":"detail of login"}',
        };
        const refreshResp: BackofficeRefreshResponse =
          await BackofficeService.refreshCustomerToken(refreshReq);

        const normalized = {
          customer_oauth_token: refreshResp.response.oauth_token,
          expiration_timestamp: refreshResp.response.expiration_timestamp,
          customer_refresh_token: user.refresh_token,
          refresh_expiration_timestamp: '',
          client_state_ret: 9,
        };

        logger.info('User logged in via refresh successfully', {
          userId: user.id,
          email: user.email,
        });

        return { response: normalized, err: null };
      }

      logger.info('User logged in successfully (new connection)', {
        userId: user.id,
        email: user.email,
      });

      return { response: connectionResp.response, err: null };
    } catch (error) {
      logger.error('Login failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: loginData.email,
      });
      throw error;
    }
  }
}
