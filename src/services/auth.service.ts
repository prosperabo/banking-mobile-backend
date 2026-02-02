import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
  BackofficeCreateAccountData,
  BackofficeAccountResponse,
  isBackofficeError,
  UserCreateData,
  JwtPayload,
} from '@/schemas';
import { buildLogger } from '@/utils';
import { BackofficeService } from '@/services/customer.backoffice.service';
import { UserRepository } from '@/repositories/user.repository';
import { BackofficeRepository } from '@/repositories/backoffice.repository';
import { JwtUtil } from '@/utils/jwt.utils';
import { config } from '@/config';
// import bcrypt from 'bcrypt';

const logger = buildLogger('auth-service');

export class AuthService {
  static async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { email, password } = loginData;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      logger.warn('User not found', { email });
      throw new Error('Invalid credentials');
    }

    // Validation in plain text (DB has plain text passwords)
    if (password !== user.password) {
      logger.warn('Invalid password', { userId: user.id });
      throw new Error('Invalid credentials');
    }

    // Validation with bcrypt (if passwords were hashed)
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
      throw new Error('Authentication configuration not found');
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
        customerId: authState.externalCustomerId ?? 0,
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

  static async register(registerData: RegisterRequest): Promise<LoginResponse> {
    const { email, password, completeName, phone } = registerData;

    // 1. Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      logger.warn('User already exists', { email });
      throw new Error('User already exists');
    }

    // 2. Create account in 123 Backoffice
    const backofficeAccountData: BackofficeCreateAccountData = {
      email,
      password,
      completeName,
      phone,
    };

    const backofficeResponse = await BackofficeService.createAccountIn123(
      backofficeAccountData
    );

    if (isBackofficeError(backofficeResponse)) {
      logger.error('Failed to create account in backoffice', {
        error: backofficeResponse.err,
      });
      throw new Error('Error creating account in banking system');
    }

    const backofficeAccount = backofficeResponse as BackofficeAccountResponse;

    // 3. Create user in local database with proper defaults
    const userCreateData: UserCreateData = {
      email,
      password, // Consider hashing in production
      completeName,
      phone,
      gender: 'MASCULINO' as const,
      birthDate: new Date(), // Placeholder - should come from request
      birthCountry: 'MX',
      curp: 'TEMP000000HDFXXX00', // Placeholder - should be generated
      postalCode: '00000',
      state: 'CDMX',
      country: 'Mexico',
      municipality: 'Cuauhtemoc',
      street: 'Reforma',
      colony: 'Centro',
      externalNumber: '1',
      internalNumber: '1',
    };

    const newUser = await UserRepository.createFromRegistration(userCreateData);

    // 4. Save backoffice profile
    await BackofficeRepository.upsertProfile(
      newUser.id,
      {
        Users: { connect: { id: newUser.id } },
        external_customer_id: parseInt(backofficeAccount.id),
        ewallet_id: parseInt(backofficeAccount.ewallet_id),
        // Add other backoffice fields as needed
      },
      {
        external_customer_id: parseInt(backofficeAccount.id),
        ewallet_id: parseInt(backofficeAccount.ewallet_id),
      }
    );

    // 5. Save authentication state
    await BackofficeRepository.upsertAuthState(
      newUser.id,
      {
        Users: { connect: { id: newUser.id } },
        clientState: 9,
        deviceId: this.generateDeviceId(),
        privateKey: backofficeAccount.private_key,
        refreshToken: backofficeAccount.refresh_token,
        extraLoginData: JSON.stringify({
          email: backofficeAccount.email,
          mobile: backofficeAccount.mobile,
        }),
        lastCustomerOauthToken: backofficeAccount.oauth_token,
        externalCustomerId: parseInt(backofficeAccount.id),
        ewalletId: parseInt(backofficeAccount.ewallet_id),
      },
      {
        clientState: 9,
        deviceId: this.generateDeviceId(),
        privateKey: backofficeAccount.private_key,
        refreshToken: backofficeAccount.refresh_token,
        extraLoginData: JSON.stringify({
          email: backofficeAccount.email,
          mobile: backofficeAccount.mobile,
        }),
        lastCustomerOauthToken: backofficeAccount.oauth_token,
        externalCustomerId: parseInt(backofficeAccount.id),
        ewalletId: parseInt(backofficeAccount.ewallet_id),
      }
    );

    // 6. Generate JWT token
    const jwtPayload: JwtPayload = {
      userId: newUser.id,
      email: newUser.email,
      username: newUser.completeName,
      backoffice: {
        customer_oauth_token: backofficeAccount.oauth_token,
        expiration_timestamp: '',
        customer_refresh_token: backofficeAccount.refresh_token,
        refresh_expiration_timestamp: '',
        client_state_ret: 9,
        customerId: parseInt(backofficeAccount.id),
      },
    };

    const jwt = JwtUtil.generateToken(jwtPayload);

    logger.info('User registered successfully', {
      userId: newUser.id,
      backofficeCustomerId: backofficeAccount.id,
    });

    return {
      token: jwt,
    };
  }

  /**
   * Generate a unique device ID for authentication
   */
  private static generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
