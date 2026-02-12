import {
  LoginRequest,
  LoginResponse,
  BackofficeLoginRequest,
  BackofficeLoginResponse,
  BackofficeRefreshRequest,
  BackofficeRefreshResponse,
  BackofficeCreateAccountData,
  BackofficeAccountResponse,
  UserWithAuthState,
  LoginByEmailPasswordRequest,
  BackofficeJwtData,
  AuthState,
} from '@/schemas';
import { buildLogger } from '@/utils';
import { BackofficeService } from '@/services/customer.backoffice.service';
import { UserRepository } from '@/repositories/user.repository';
import { BackofficeRepository } from '@/repositories/backoffice.repository';
import { JwtUtil } from '@/utils/jwt.utils';
import { hashPassword } from '@/utils/hash.utils';
import { config } from '@/config';
import { UnauthorizedError, NotFoundError } from '@/shared/errors';
import { CampaignBackofficeService } from './campaign.backoffice.service';
import {
  BiometricVerifyRequest,
  LoginMethod,
} from '@/schemas/biometric.schemas';
import { BiometricAuthService } from './auth.biometric.service';

const logger = buildLogger('AuthService');

export class AuthService {
  static async login(
    method: LoginMethod,
    loginData: LoginRequest
  ): Promise<LoginResponse> {
    switch (method) {
      case 'biometric':
        return this.loginByBiometric(loginData as BiometricVerifyRequest);
      case 'password':
      default:
        return this.loginByEmailPassword(
          loginData as LoginByEmailPasswordRequest
        );
    }
  }

  static async loginByEmailPassword(
    loginData: LoginByEmailPasswordRequest
  ): Promise<LoginResponse> {
    const { email, password } = loginData;

    const user = await UserRepository.findByEmail(email);
    if (!user) {
      logger.warn('User not found', { email });
      throw new UnauthorizedError('Invalid credentials');
    }

    // MVP: passwords en plain text
    if (password !== user.password) {
      logger.warn('Invalid password', { userId: user.id });
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.buildJwtToken(user.email, user.id);
  }

  static async loginByBiometric(
    biometricData: BiometricVerifyRequest
  ): Promise<LoginResponse> {
    const { userId } =
      await BiometricAuthService.verifyChallenge(biometricData);

    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    return this.buildJwtToken(user.email, user.id);
  }

  private static async buildJwtToken(
    userEmail: string,
    userId: number
  ): Promise<LoginResponse> {
    const userWithAuthState =
      await UserRepository.findByEmailWithAuthState(userEmail);
    if (!userWithAuthState) {
      logger.warn('User not found for token build', { userEmail, userId });
      throw new NotFoundError('User not found');
    }

    const authState = userWithAuthState.BackofficeAuthState;
    if (!authState) {
      logger.error('BackofficeAuthState not found for user', { userId });
      throw new NotFoundError('Authentication configuration not found');
    }

    const backofficeData = await this.getBackofficeJwtData(
      userWithAuthState,
      authState,
      userId
    );

    const jwt = JwtUtil.generateToken({
      userId: userWithAuthState.id,
      email: userWithAuthState.email,
      username: userWithAuthState.completeName,
      backoffice: backofficeData,
    });

    return { token: jwt };
  }

  private static async getBackofficeJwtData(
    user: UserWithAuthState,
    authState: AuthState,
    fallbackUserId: number
  ): Promise<BackofficeJwtData> {
    const ecommerceToken = config.ecommerceToken;
    const deviceId = authState.deviceId;

    let connectionResp: BackofficeLoginResponse | undefined;

    try {
      const req: BackofficeLoginRequest = {
        client_state: 9,
        customer_id: authState.externalCustomerId ?? fallbackUserId,
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

    if (connectionResp?.response?.customer_oauth_token) {
      logger.info('User logged in successfully (new connection)', {
        userId: user.id,
        email: user.email,
      });

      return {
        ...connectionResp.response,
        customerId: authState.externalCustomerId ?? 0,
      };
    }

    const refreshReq: BackofficeRefreshRequest = {
      customer_refresh_token: authState.refreshToken,
      device_id: deviceId,
      ecommerce_token: ecommerceToken,
      extra_login_data: '{"idAuth":1,"detail":"detail of login"}',
    };

    const refreshResp: BackofficeRefreshResponse =
      await BackofficeService.refreshCustomerToken(refreshReq);

    logger.info('User logged in via refresh successfully', {
      userId: user.id,
      email: user.email,
    });

    return {
      customer_oauth_token: refreshResp.response.oauth_token,
      expiration_timestamp: refreshResp.response.expiration_timestamp,
      customer_refresh_token: authState.refreshToken,
      refresh_expiration_timestamp: '',
      client_state_ret: 9,
      customerId: authState.externalCustomerId ?? 0,
    };
  }

  static async registerByEmail(
    email: string
  ): Promise<{ email: string; created: boolean }> {
    // Find user by email (including backoffice state)
    const userWithAuthState =
      await UserRepository.findByEmailWithAuthState(email);

    if (!userWithAuthState) {
      logger.warn('User not found for registerByEmail', { email });
      throw new NotFoundError('User not found. Complete registration first.');
    }

    const user: UserWithAuthState = userWithAuthState;

    // If already has backoffice profile or auth state, nothing to create
    if (userWithAuthState.BackofficeAuthState) {
      logger.info('User already provisioned in backoffice', {
        userId: user.id,
      });
      return { email: user.email, created: false };
    }

    // Ensure password is hashed before sending to backoffice (API expects a password hash)
    let passwordToSend = user.password;
    // existing plain-text password — hash for Backoffice request only, do NOT persist
    const hashed = await hashPassword(user.password);
    passwordToSend = hashed;
    logger.info(
      'Using hashed password for backoffice request only (not persisted)',
      { userId: user.id }
    );

    const deviceId = this.generateDeviceId();

    // Build backoffice account payload from separate fields
    const backofficeAccountData: BackofficeCreateAccountData = {
      device_id: deviceId,
      email: user.email,
      password: passwordToSend,
      firstName: user.firstName,
      lastName: user.lastName,
      secondLastName: user.secondLastName,
      gender: user.gender,
      phone: user.phone,
      countryCode: user.countryCode,
      rfc: user.rfc,
      postalCode: user.postalCode,
    };

    const backofficeResponse = await BackofficeService.createAccountIn123(
      backofficeAccountData
    );

    const backofficeAccount = backofficeResponse as BackofficeAccountResponse;

    // Persist backoffice customer profile
    await BackofficeRepository.upsertProfile(
      user.id,
      {
        Users: { connect: { id: user.id } },
        external_customer_id: parseInt(String(backofficeAccount.id)),
        ewallet_id: parseInt(String(backofficeAccount.ewallet_id)),
        oauth_token: backofficeAccount.oauth_token,
        private_key: backofficeAccount.private_key,
        refresh_token: backofficeAccount.refresh_token,
        email: backofficeAccount.email,
        first_name: backofficeAccount.first_name,
        last_name: backofficeAccount.last_name,
        second_last_name: backofficeAccount.second_last_name,
        mobile: String(backofficeAccount.mobile),
        gender: backofficeAccount.gender,
        gender_string: backofficeAccount.gender_string,
        rfc: backofficeAccount.rfc,
        zipcode: backofficeAccount.zipcode,
        ewallet_status: backofficeAccount.ewallet_status,
        account_level: backofficeAccount.account_level,
        account_status: backofficeAccount.account_status,
        account_status_string: backofficeAccount.account_status_string,
        address: backofficeAccount.address,
        address_document_back: backofficeAccount.address_document_back,
        address_document_back_url: backofficeAccount.address_document_back_url,
        address_document_front: backofficeAccount.address_document_front,
        address_document_front_url:
          backofficeAccount.address_document_front_url,
        address_document_type: backofficeAccount.address_document_type,
        are_account_resources_of_user:
          backofficeAccount.are_account_resources_of_user,
        business_name: backofficeAccount.business_name,
        business_purpose: backofficeAccount.business_purpose,
        ciabe: backofficeAccount.clabe,
        city: backofficeAccount.city,
        colony: backofficeAccount.colony,
        constitution_date: backofficeAccount.constitution_date,
        correspondence_address: backofficeAccount.correspondence_address,
        country_of_birth: backofficeAccount.country_of_birth,
        date_of_birth: backofficeAccount.date_of_birth,
        ecommerce_id: backofficeAccount.ecommerce_id,
        exterior: backofficeAccount.exterior,
        identification_document_back:
          backofficeAccount.identification_document_back,
        identification_document_back_url:
          backofficeAccount.identification_document_back_url,
        identification_document_front:
          backofficeAccount.identification_document_front,
        identification_document_front_url:
          backofficeAccount.identification_document_front_url,
        identification_document_type:
          backofficeAccount.identification_document_type,
        interior: backofficeAccount.interior,
        is_business: backofficeAccount.is_business,
        mobile_country_code: backofficeAccount.mobile_country_code,
        nationality_id: backofficeAccount.nationality_id,
        occupation_id: backofficeAccount.occupation_id,
        person_type: backofficeAccount.person_type,
        risk_level: backofficeAccount.risk_level,
        society_type: backofficeAccount.society_type,
        selfie: backofficeAccount.selfie,
        selfie_url: backofficeAccount.selfie_url,
        state_id: backofficeAccount.state_id,
        street: backofficeAccount.street,
        telephone: backofficeAccount.telephone,
      },
      {
        external_customer_id: parseInt(String(backofficeAccount.id)),
        ewallet_id: parseInt(String(backofficeAccount.ewallet_id)),
        oauth_token: backofficeAccount.oauth_token,
        private_key: backofficeAccount.private_key,
        refresh_token: backofficeAccount.refresh_token,
        email: backofficeAccount.email,
        first_name: backofficeAccount.first_name,
        last_name: backofficeAccount.last_name,
        second_last_name: backofficeAccount.second_last_name,
        mobile: String(backofficeAccount.mobile),
        gender: backofficeAccount.gender,
        gender_string: backofficeAccount.gender_string,
        rfc: backofficeAccount.rfc,
        zipcode: backofficeAccount.zipcode,
        ewallet_status: backofficeAccount.ewallet_status,
        account_level: backofficeAccount.account_level,
        account_status: backofficeAccount.account_status,
        account_status_string: backofficeAccount.account_status_string,
        address: backofficeAccount.address,
        address_document_back: backofficeAccount.address_document_back,
        address_document_back_url: backofficeAccount.address_document_back_url,
        address_document_front: backofficeAccount.address_document_front,
        address_document_front_url:
          backofficeAccount.address_document_front_url,
        address_document_type: backofficeAccount.address_document_type,
        are_account_resources_of_user:
          backofficeAccount.are_account_resources_of_user,
        business_name: backofficeAccount.business_name,
        business_purpose: backofficeAccount.business_purpose,
        ciabe: backofficeAccount.clabe,
        city: backofficeAccount.city,
        colony: backofficeAccount.colony,
        constitution_date: backofficeAccount.constitution_date,
        correspondence_address: backofficeAccount.correspondence_address,
        country_of_birth: backofficeAccount.country_of_birth,
        date_of_birth: backofficeAccount.date_of_birth,
        ecommerce_id: backofficeAccount.ecommerce_id,
        exterior: backofficeAccount.exterior,
        identification_document_back:
          backofficeAccount.identification_document_back,
        identification_document_back_url:
          backofficeAccount.identification_document_back_url,
        identification_document_front:
          backofficeAccount.identification_document_front,
        identification_document_front_url:
          backofficeAccount.identification_document_front_url,
        identification_document_type:
          backofficeAccount.identification_document_type,
        interior: backofficeAccount.interior,
        is_business: backofficeAccount.is_business,
        mobile_country_code: backofficeAccount.mobile_country_code,
        nationality_id: backofficeAccount.nationality_id,
        occupation_id: backofficeAccount.occupation_id,
        person_type: backofficeAccount.person_type,
        risk_level: backofficeAccount.risk_level,
        society_type: backofficeAccount.society_type,
        selfie: backofficeAccount.selfie,
        selfie_url: backofficeAccount.selfie_url,
        state_id: backofficeAccount.state_id,
        street: backofficeAccount.street,
        telephone: backofficeAccount.telephone,
      }
    );

    // Persist auth state
    await BackofficeRepository.upsertAuthState(
      user.id,
      {
        Users: { connect: { id: user.id } },
        clientState: 9,
        deviceId: deviceId,
        privateKey: backofficeAccount.private_key,
        refreshToken: backofficeAccount.refresh_token,
        extraLoginData: JSON.stringify({
          email: backofficeAccount.email,
          mobile: String(backofficeAccount.mobile),
        }),
        lastCustomerOauthToken: backofficeAccount.oauth_token,
        externalCustomerId: parseInt(String(backofficeAccount.id)),
        ewalletId: parseInt(String(backofficeAccount.ewallet_id)),
      },
      {
        clientState: 9,
        deviceId: deviceId,
        privateKey: backofficeAccount.private_key,
        refreshToken: backofficeAccount.refresh_token,
        extraLoginData: JSON.stringify({
          email: backofficeAccount.email,
          mobile: String(backofficeAccount.mobile),
        }),
        lastCustomerOauthToken: backofficeAccount.oauth_token,
        externalCustomerId: parseInt(String(backofficeAccount.id)),
        ewalletId: parseInt(String(backofficeAccount.ewallet_id)),
      }
    );

    await CampaignBackofficeService.assignCustomersToProgram({
      customer_ids: [parseInt(String(backofficeAccount.id))],
      program_code: config.campaing.programCode,
    });

    logger.info('Backoffice account created and saved for user', {
      userId: user.id,
    });

    return { email: user.email, created: true };
  }

  /**
   * Generate a unique device ID for authentication
   */
  private static generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
