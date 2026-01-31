import { CampaignBackofficeService } from './campaign.backoffice.service';
import { buildLogger } from '@/utils';
import { AssignUsersToProgram } from '@/schemas/campaign.schemas';
import { ForbiddenError } from '@/shared/errors';

const logger = buildLogger('CampaignService');

export class CampaignService {
  /**
   * Assigns multiple users to a program/campaign
   */
  static async assignUsersToProgram(
    userId: number,
    assignData: AssignUsersToProgram
  ) {
    logger.info(
      `Assigning ${assignData.customer_ids.length} customers to program ${assignData.program_code}`
    );
    if (userId !== 9) {
      throw new ForbiddenError('Unauthorized user');
    }
    const response = await CampaignBackofficeService.assignCustomersToProgram({
      program_code: assignData.program_code,
      customer_ids: assignData.customer_ids,
    });

    logger.info(
      `Customers successfully assigned to program ${assignData.program_code}`,
      {
        program_id: response.payload.program_id,
        new_count: response.payload.new_assigned_customers.length,
        update_count: response.payload.update_assignments_customers.length,
      }
    );

    return {
      program_id: response.payload.program_id,
      assigned_customers: assignData.customer_ids,
      new_assigned_customers: response.payload.new_assigned_customers,
      update_assignments_customers:
        response.payload.update_assignments_customers,
    };
  }
}
