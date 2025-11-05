import {
  LoginRequest,
  LoginResponse,
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
} from '@/schemas';
import { buildLogger, JwtUtil } from '@/utils';
import { BackofficeService } from '@/services/backoffice.service';
import { UserRepository } from '@/repositories/user.repository';
import { config } from '@/config';
import { UnauthorizedError, NotFoundError } from '@/shared/errors';
// import bcrypt from 'bcrypt';

const logger = buildLogger('auth-service');

export class AuthService {
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      logger.warn('User not found', { email });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Plain text validation (DB has plain text passwords)
    if (password !== user.password) {
      logger.warn('Invalid password', { userId: user.id });
      throw new UnauthorizedError('Invalid credentials');
    }

    // Bcrypt validation (if passwords were hashed)
    // const isValidPassword = await bcrypt.compare(password, user.password);
    // if (!isValidPassword) {
    //   logger.warn('Invalid password', { userId: user.id });
    //   throw new Error('Invalid credentials');
    // }

    const userWithAuthState =
      await UserRepository.findByEmailWithAuthState(email);
    const authState = userWithAuthState?.BackofficeAuthState;
    if (!authState) {
      logger.error('BackofficeAuthState not found for user', {
        userId: user.id,
      });
      throw new NotFoundError('Authentication configuration not found');
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
      connectionResp = await BackofficeService.getCustomerConnectionToken(req);
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

      const backofficeData = {
        customer_oauth_token: refreshResp.response.oauth_token,
        expiration_timestamp: refreshResp.response.expiration_timestamp,
        customer_refresh_token: authState.refreshToken,
        refresh_expiration_timestamp: '',
        client_state_ret: 9,
        customerId: authState.externalCustomerId,
      };

      const jwt = JwtUtil.generateToken({
        userId: user.id,
        email: user.email,
        username: user.completeName,
        backoffice: backofficeData,
      });

      logger.info('User logged in via refresh successfully', {
        userId: user.id,
        email: user.email,
      });

      return {
        token: jwt,
      };
    }

    const jwt = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      username: user.completeName,
      backoffice: {
        ...connectionResp.response,
        customerId: authState.externalCustomerId,
      },
    });

    logger.info('User logged in successfully (new connection)', {
      userId: user.id,
      email: user.email,
    });

    return {
      token: jwt,
    };
  }
}
