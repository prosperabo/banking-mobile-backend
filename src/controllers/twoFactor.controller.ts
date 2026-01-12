import { Request, Response } from 'express';
import { TwoFactorService } from '@/services/twoFactor.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import {
  VerifySetupRequest,
  VerifyLoginCodeRequest,
  DisableTwoFactorRequest,
} from '@/schemas/twoFactor.schemas';

const logger = buildLogger('TwoFactorController');

export class TwoFactorController {
  /**
   * POST /auth/2fa/setup
   * Starts the 2FA setup, generates QR code
   */
  static setup = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const email = req.user!.email;

    logger.info('Setting up 2FA', { userId });

    const result = await TwoFactorService.initiateSetup(userId, email);

    logger.info('2FA setup initiated successfully', { userId });
    successHandler(res, result, 'Scan the QR code with your authenticator app');
  });

  /**
   * POST /auth/2fa/verify-setup
   * Verifies the code and activates 2FA
   */
  static verifySetup = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { code, secret }: VerifySetupRequest = req.body;

    logger.info('Verifying 2FA setup', { userId });

    const result = await TwoFactorService.verifyAndActivate(
      userId,
      secret,
      code
    );

    logger.info('2FA activated successfully', { userId });
    successHandler(
      res,
      result,
      'Two-factor authentication enabled successfully'
    );
  });

  /**
   * POST /auth/2fa/verify
   * Verifies the code during login
   */
  static verifyLogin = catchErrors(async (req: Request, res: Response) => {
    const userId = req.tempUser!.userId;
    const { code }: VerifyLoginCodeRequest = req.body;

    logger.info('Verifying 2FA code for login', { userId });

    // Validate the code
    await TwoFactorService.verifyLoginCode(userId, code);

    // Import AuthService to generate final JWT
    // const { AuthService } = await import('@/services/auth.service');
    const { UserRepository } = await import('@/repositories/user.repository');

    // Get full user with authState
    const user = await UserRepository.findByEmailWithAuthState(
      req.tempUser!.email
    );
    if (!user) {
      throw new Error('User not found');
    }

    // Generate final JWT with backoffice data (reuse login logic)
    const authState = user.BackofficeAuthState;
    if (!authState) {
      throw new Error('Authentication configuration not found');
    }

    const { config } = await import('@/config');
    const { BackofficeService } = await import('@/services/backoffice.service');
    const { JwtUtil } = await import('@/utils/jwt.utils');

    const ecommerceToken = config.ecommerceToken;
    const deviceId = authState.deviceId;

    // Try to get backoffice token
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
      // If it fails, use the refresh token
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

      logger.info('2FA verification successful, JWT generated', { userId });
      return successHandler(res, { token: jwt }, 'Login successful');
    }

    // Generate JWT with connectionResp
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
    successHandler(res, { token: jwt }, 'Login successful');
  });

  /**
   * GET /auth/2fa/status
   * Gets the 2FA status of the user
   */
  static getStatus = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Getting 2FA status', { userId });

    const result = await TwoFactorService.getStatus(userId);

    successHandler(res, result, '2FA status retrieved successfully');
  });

  /**
   * POST /auth/2fa/disable
   * Disables 2FA for the user
   */
  static disable = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { password, code }: DisableTwoFactorRequest = req.body;

    logger.info('Disabling 2FA', { userId });

    const result = await TwoFactorService.disable(userId, password, code);

    logger.info('2FA disabled successfully', { userId });
    successHandler(
      res,
      result,
      'Two-factor authentication disabled successfully'
    );
  });
}
