import {
  LoginRequest,
  LoginResponse,
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
} from '@/types';
import { buildLogger } from '@/shared/utils';
import { BackofficeService } from '@/services/backoffice.service';
import { db, config } from '@/config';
// import bcrypt from 'bcrypt';

const logger = buildLogger('auth-service');

export class AuthService {
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, password } = loginData;

      const user = await db.users.findUnique({ where: { email } });
      if (!user) {
        logger.warn('User not found', { email });
        throw new Error('Credenciales inválidas');
      }

      // Validación en texto plano (la DB tiene contraseñas en texto plano)
      if (password !== user.password) {
        logger.warn('Invalid password', { userId: user.id });
        throw new Error('Credenciales inválidas');
      }

      // Validación con bcrypt (si las contraseñas estuvieran hasheadas)
      // const isValidPassword = await bcrypt.compare(password, user.password);
      // if (!isValidPassword) {
      //   logger.warn('Invalid password', { userId: user.id });
      //   throw new Error('Credenciales inválidas');
      // }

      const authState = await db.backofficeAuthState.findUnique({
        where: { userId: user.id },
      });
      if (!authState) {
        logger.error('BackofficeAuthState not found for user', {
          userId: user.id,
        });
        throw new Error('Configuración de autenticación no encontrada');
      }

      const ecommerceToken = config.ecommerceToken;
      const deviceId = authState.deviceId;

      let connectionResp: BackofficeLoginResponse | undefined;
      try {
        const req: BackofficeLoginRequest = {
          client_state: 9,
          customer_id: authState.externalCustomerId ?? user.id,
          customer_private_key: authState.privateKey,
          customer_refresh_token: authState.refreshToken,
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
          customer_refresh_token: authState.refreshToken,
          device_id: deviceId,
          ecommerce_token: ecommerceToken,
          extra_login_data: '{"idAuth":1,"detail":"detail of login"}',
        };
        const refreshResp: BackofficeRefreshResponse =
          await BackofficeService.refreshCustomerToken(refreshReq);

        const normalized = {
          customer_oauth_token: refreshResp.response.oauth_token,
          expiration_timestamp: refreshResp.response.expiration_timestamp,
          customer_refresh_token: authState.refreshToken,
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
