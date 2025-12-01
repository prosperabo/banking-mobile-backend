import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
} from '@/schemas';
import { buildLogger } from '@/utils';
import { BackofficeService } from '@/services/backoffice.service';
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

  static async register(registerData: RegisterRequest): Promise<LoginResponse> {
    const { email, password, completeName, phone } = registerData;

    // 1. Check if user already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      logger.warn('User already exists', { email });
      throw new Error('User already exists');
    }

    // 2. Create user in Backoffice (123)
    const backofficeResponse = await BackofficeService.createAccountIn123({
      email,
      password,
      completeName,
      phone,
    });

    if (backofficeResponse.err) {
      logger.error('Failed to create account in backoffice', {
        error: backofficeResponse.err,
      });
      throw new Error('Error creating account in banking system');
    }

    const backofficeData = backofficeResponse.ss ?? backofficeResponse.rs;
    if (!backofficeData) {
      throw new Error('Invalid response from banking system');
    }

    // 3. Create user in local DB
    const newUser = await UserRepository.create({
      email,
      password, // Storing plain text as per existing pattern
      completeName,
      phone,
      gender: 'MASCULINO', // Default or need to ask? Assuming default for now or we need to add it to request.
      birthDate: new Date(), // Placeholder
      birthCountry: 'MX',
      curp: 'AAAA000000HDFXXX00', // Placeholder
      postalCode: '00000',
      state: 'CDMX',
      country: 'Mexico',
      municipality: 'Cuauhtemoc',
      street: 'Reforma',
      colony: 'Centro',
      externalNumber: '1',
      internalNumber: '1',
    });

    // 4. Save Backoffice profile and auth state
    // We need to match the type expected by Prisma.
    // upsertProfile expects CreateInput.
    // BackofficeCustomerProfileCreateInput requires 'Users' relation connection.
    const profileData: any = {
      Users: { connect: { id: newUser.id } },
      ...backofficeData
    };
    await BackofficeRepository.upsertProfile(newUser.id, profileData, backofficeData);

    // Prepare auth state data
    const authStateData: any = {
      Users: { connect: { id: newUser.id } },
      clientState: 9,
      deviceId: 'generated-device-id', // We need generateDeviceId here
      privateKey: backofficeData.private_key,
      refreshToken: backofficeData.refresh_token,
      extraLoginData: JSON.stringify({
        email: backofficeData.email,
        mobile: backofficeData.mobile,
      }),
      lastCustomerOauthToken: backofficeData.oauth_token,
      externalCustomerId: backofficeData.id,
      ewalletId: backofficeData.ewallet_id,
    };

    await BackofficeRepository.upsertAuthState(newUser.id, authStateData, authStateData);

    // 5. Generate token
    const jwt = JwtUtil.generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.completeName,
      backoffice: {
        customer_oauth_token: backofficeData.oauth_token,
        expiration_timestamp: '', // We might need this from response
        customer_refresh_token: backofficeData.refresh_token,
        refresh_expiration_timestamp: '',
        client_state_ret: 9,
        customerId: backofficeData.id,
      },
    });

    logger.info('User registered successfully', { userId: newUser.id });

    return {
      token: jwt,
    };
  }
}
