import { Request, Response } from 'express';

import { PushService } from '@/services/push.service';
import { RegisterDevicePayload } from '@/schemas/notification.schemas';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';

const logger = buildLogger('PushController');

export class PushController {
  static registerDevice = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const payload: RegisterDevicePayload = req.body;

    logger.info('Registering push device token', {
      userId,
      platform: payload.platform,
    });

    const result = await PushService.registerDevice(userId, payload);

    logger.info('Push device token registered', { userId });

    return successHandler(res, result, 'Device registered successfully');
  });
}
