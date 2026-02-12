import { Request, Response } from 'express';
import { BiometricAuthService } from '@/services/auth.biometric.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { BiometricChallengeRequest, BiometricEnrollRequest } from '@/schemas';

const logger = buildLogger('BiometricAuthController');

export class BiometricAuthController {
  static enroll = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const biometricEnroll: BiometricEnrollRequest = req.body;

    logger.info('Biometric enroll', {
      userId,
      deviceId: biometricEnroll.deviceId,
    });

    const result = await BiometricAuthService.enroll(userId, biometricEnroll);
    successHandler(res, result, 'Biometric enroll successful');
  });

  static challenge = catchErrors(async (req: Request, res: Response) => {
    const biometricChallenge: BiometricChallengeRequest = req.body;

    logger.info('Biometric challenge', {
      deviceId: biometricChallenge.deviceId,
    });

    const result =
      await BiometricAuthService.createChallenge(biometricChallenge);
    successHandler(res, result, 'Challenge created');
  });
}
