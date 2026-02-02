import backOfficeInstance from '@/api/backoffice.instance';
import {
  AssignCustomersParams,
  AssignCustomersResponse,
} from '@/schemas/campaign.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('CampaignBackofficeService');

export class CampaignBackofficeService {
  /**
   * Assigns a list of customers to a program
   * Returns new and updated assignments
   */
  static async assignCustomersToProgram(
    params: AssignCustomersParams
  ): Promise<AssignCustomersResponse> {
    logger.info('Assigning customers to program with params:', { params });

    const response = await backOfficeInstance.post<AssignCustomersResponse>(
      '/debit/v1/customer-program/assign-customer',
      params
    );

    logger.info('Customers assigned to program successfully. Response:', {
      response: response.data,
    });
    return response.data;
  }
}
