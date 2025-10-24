import backOfficeInstance from '@/api/backoffice.instance';
import { buildLogger } from '@/utils';
import {
  GetTransactionsParams,
  GetTransactionsResponse,
} from '@/schemas/transactions.schemas';

const logger = buildLogger('TransactionsBackofficeService');

export class TransactionsBackofficeService {
  static async getCustomerTransactions(
    params: GetTransactionsParams,
    customerToken: string
  ): Promise<GetTransactionsResponse> {
    logger.info('Fetching customer transactions with params:', { params });

    const { customer_id, ...queryParams } = params;

    const response = await backOfficeInstance.get<GetTransactionsResponse>(
      `/transactions/${customer_id}`,
      {
        params: queryParams,
        headers: {
          'Authorization-customer': customerToken,
        },
      }
    );

    logger.info('Customer transactions fetched successfully. Response:', {
      totalCount: response.data.payload.totalCount,
    });
    return response.data;
  }
}
