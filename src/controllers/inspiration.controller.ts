import { Request, Response } from 'express';

import { InspirationService } from '@/services/inspiration.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';

const logger = buildLogger('InspirationController');

export class InspirationController {
  static getDailyInspiration = catchErrors(
    async (req: Request, res: Response) => {
      logger.info('Getting daily inspiration');

      const inspiration = await InspirationService.getDailyInspiration();

      logger.info('Daily inspiration retrieved successfully');
      return successHandler(
        res,
        inspiration,
        'Daily inspiration retrieved successfully'
      );
    }
  );
}
