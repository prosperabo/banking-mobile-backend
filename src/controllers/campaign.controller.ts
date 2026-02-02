import { Request, Response } from 'express';
import { CampaignService } from '@/services/campaign.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { AssignUsersToProgram } from '@/schemas/campaign.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('CampaignController');

export class CampaignController {
  /**
   * Assigns users to a program/campaign
   * POST /user/programs/assign
   */
  static assignUserToProgram = catchErrors(
    async (req: Request, res: Response) => {
      const userId = req.user!.userId;
      const assignData: AssignUsersToProgram = req.body;

      logger.info(`Assigning users to program`, {
        userId,
        program_code: assignData.program_code,
        customerCount: assignData.customer_ids.length,
      });

      const result = await CampaignService.assignUsersToProgram(
        userId,
        assignData
      );

      logger.info(`Campaign assignment successful for user ${userId}`);
      return successHandler(
        res,
        result,
        'Users successfully assigned to program'
      );
    }
  );
}
