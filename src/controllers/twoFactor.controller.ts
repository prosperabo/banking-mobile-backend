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
    const email = req.tempUser!.email;
    const { code }: VerifyLoginCodeRequest = req.body;

    logger.info('Verifying 2FA code for login', { userId });

    const result = await TwoFactorService.verifyLoginAndGenerateToken(
      userId,
      email,
      code
    );

    logger.info('2FA verification successful', { userId });
    successHandler(res, result, 'Login successful');
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
