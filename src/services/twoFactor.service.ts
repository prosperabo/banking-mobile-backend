import { buildLogger } from '@/utils';
import { encrypt, decrypt } from '@/utils/encryption.utils';
import {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTPCode,
} from '@/utils/totp.utils';
import { TwoFactorRepository } from '@/repositories/twoFactor.repository';
import { UserRepository } from '@/repositories/user.repository';
import {
  SetupTwoFactorResponse,
  VerifySetupResponse,
  TwoFactorStatusResponse,
  DisableTwoFactorResponse,
  LoginResponse,
} from '@/schemas/twoFactor.schemas';
import {
  ConflictError,
  BadRequestError,
  UnauthorizedError,
} from '@/shared/errors';

const logger = buildLogger('TwoFactorService');

export class TwoFactorService {
  /**
   * Initiates 2FA setup for a user
   * Generates secret and QR code
   */
  static async initiateSetup(
    userId: number,
    email: string
  ): Promise<SetupTwoFactorResponse> {
    logger.info('Initiating 2FA setup', { userId });

    // Check if user already has 2FA enabled
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new ConflictError('Two-factor authentication is already enabled');
    }

    // Generate secret
    const { secret, otpauthUrl } = generateTOTPSecret(email);

    // Generate QR code
    const qrCode = await generateQRCode(otpauthUrl);

    logger.info('2FA setup initiated successfully', { userId });

    return {
      qrCode,
      secret, // We return the secret UNENCRYPTED so the client can send it back
      issuer: 'ProspereBank',
      account: email,
    };
  }

  /**
   * Verifies the setup code and activates 2FA
   */
  static async verifyAndActivate(
    userId: number,
    secret: string,
    code: string
  ): Promise<VerifySetupResponse> {
    logger.info('Verifying 2FA setup', { userId });

    // Check if user already has 2FA enabled
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new ConflictError('Two-factor authentication is already enabled');
    }

    // Validate the TOTP code
    const isValid = verifyTOTPCode(secret, code);
    if (!isValid) {
      logger.warn('Invalid TOTP code during setup', { userId });
      throw new UnauthorizedError('Invalid TOTP code');
    }

    // Encrypt the secret before saving
    const encryptedSecret = encrypt(secret);

    // Save to DB
    await TwoFactorRepository.create(userId, encryptedSecret);

    // Update user
    await UserRepository.updateUser(userId, {
      twoFactorEnabled: true,
    });

    logger.info('2FA enabled successfully', { userId });

    return {
      userId,
      twoFactorEnabled: true,
      activatedAt: new Date().toISOString(),
    };
  }

  /**
   * Verifies a TOTP code during login
   */
  static async verifyLoginCode(userId: number, code: string): Promise<boolean> {
    logger.info('Verifying 2FA code for login', { userId });

    // Fetch 2FA configuration
    const twoFactorAuth = await TwoFactorRepository.findByUserId(userId);
    if (!twoFactorAuth) {
      throw new BadRequestError('Two-factor authentication is not configured');
    }

    // Decrypt secret
    const secret = decrypt(twoFactorAuth.secret);

    // Validate code
    const isValid = verifyTOTPCode(secret, code);
    if (!isValid) {
      logger.warn('Invalid TOTP code during login', { userId });
      throw new UnauthorizedError('Invalid TOTP code');
    }

    logger.info('2FA code verified successfully', { userId });
    return true;
  }

  /**
   * Gets the 2FA status of a user
   */
  static async getStatus(userId: number): Promise<TwoFactorStatusResponse> {
    logger.info('Getting 2FA status', { userId });

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (!user.twoFactorEnabled) {
      return { enabled: false };
    }

    const config = await TwoFactorRepository.findByUserId(userId);
    if (!config) {
      return { enabled: false };
    }

    return {
      enabled: true,
      method: 'TOTP',
      activatedAt: config.createdAt.toISOString(),
    };
  }

  /**
   * Disables 2FA for a user
   */
  static async disable(
    userId: number,
    password: string,
    code: string
  ): Promise<DisableTwoFactorResponse> {
    logger.info('Disabling 2FA', { userId });

    // Fetch user
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    // Check if 2FA is enabled
    if (!user.twoFactorEnabled) {
      throw new BadRequestError('Two-factor authentication is not enabled');
    }

    // Validate password
    if (password !== user.password) {
      logger.warn('Incorrect password when disabling 2FA', { userId });
      throw new UnauthorizedError('Incorrect password');
    }

    // Fetch 2FA configuration
    const twoFactorAuth = await TwoFactorRepository.findByUserId(userId);
    if (!twoFactorAuth) {
      throw new BadRequestError(
        'Two-factor authentication configuration not found'
      );
    }

    // Decrypt secret and validate code
    const secret = decrypt(twoFactorAuth.secret);
    const isValid = verifyTOTPCode(secret, code);
    if (!isValid) {
      logger.warn('Invalid TOTP code when disabling 2FA', { userId });
      throw new UnauthorizedError('Invalid TOTP code');
    }

    // Delete 2FA configuration
    await TwoFactorRepository.delete(userId);

    // Update user
    await UserRepository.updateUser(userId, {
      twoFactorEnabled: false,
    });

    logger.info('2FA disabled successfully', { userId });

    return {
      userId,
      twoFactorEnabled: false,
      disabledAt: new Date().toISOString(),
    };
  }

  /**
   * Verifies 2FA code and generates final JWT with backoffice integration
   * This encapsulates all the login logic after 2FA verification
   */
  static async verifyLoginAndGenerateToken(
    userId: number,
    email: string,
    code: string
  ): Promise<LoginResponse> {
    logger.info('Verifying 2FA code and generating token', { userId });

    // Verify the TOTP code
    await this.verifyLoginCode(userId, code);

    // Get full user with authState
    const user = await UserRepository.findByEmailWithAuthState(email);
    if (!user) {
      throw new BadRequestError('User not found');
    }

    const authState = user.BackofficeAuthState;
    if (!authState) {
      throw new BadRequestError('Authentication configuration not found');
    }

    const { config } = await import('@/config');
    const { BackofficeService } = await import('@/services/backoffice.service');
    const { JwtUtil } = await import('@/utils/jwt.utils');

    const ecommerceToken = config.ecommerceToken;
    const deviceId = authState.deviceId;

    // Try to get backoffice connection token
    let connectionResp;
    try {
      connectionResp = await BackofficeService.getCustomerConnectionToken({
        client_state: 9,
        customer_id: authState.externalCustomerId ?? user.id,
        customer_private_key: authState.privateKey,
        customer_refresh_token: authState.refreshToken,
        device_id: deviceId,
        ecommerce_token: ecommerceToken,
        extra_login_data: '{"idAuth":1,"detail":"detail of login"}',
      });
    } catch {
      // If connection fails, use refresh token
      logger.info('Connection token failed, using refresh token', { userId });
    }

    // If connection failed, refresh the token
    if (!connectionResp || !connectionResp.response?.customer_oauth_token) {
      const refreshResp = await BackofficeService.refreshCustomerToken({
        customer_refresh_token: authState.refreshToken,
        device_id: deviceId,
        ecommerce_token: ecommerceToken,
        extra_login_data: '{"idAuth":1,"detail":"detail of login"}',
      });

      const jwt = JwtUtil.generateToken({
        userId: user.id,
        email: user.email,
        username: user.completeName,
        backoffice: {
          customer_oauth_token: refreshResp.response.oauth_token,
          expiration_timestamp: refreshResp.response.expiration_timestamp,
          customer_refresh_token: authState.refreshToken,
          refresh_expiration_timestamp: '',
          client_state_ret: 9,
          customerId: authState.externalCustomerId,
        },
      });

      logger.info('2FA verification successful, JWT generated via refresh', {
        userId,
      });

      return { token: jwt };
    }

    // Generate JWT with connection response
    const jwt = JwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      username: user.completeName,
      backoffice: {
        ...connectionResp.response,
        customerId: authState.externalCustomerId,
      },
    });

    logger.info('2FA verification successful, JWT generated', { userId });

    return { token: jwt };
  }
}
