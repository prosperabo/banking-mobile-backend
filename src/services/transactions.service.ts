import { buildLogger } from '@/utils';
import { TransactionsBackofficeService } from './transactions.backoffice.service';
import { simplifyTransaction } from '@/utils/transaction.utils';
import { SimplifiedTransaction } from '@/schemas/transactions.schemas';

const logger = buildLogger('TransactionsService');

export class TransactionsService {
  static async getUserTransactions(
    userId: number,
    customerToken: string,
    customerId: number,
    limit: number = 100,
    offset?: number,
    from?: string,
    to?: string,
    desc: boolean = true,
    transactionId?: number,
    onlyInstallmentCharges: boolean = false
  ): Promise<{
    transactions: SimplifiedTransaction[];
    totalCount: number;
  }> {
    logger.info('Fetching transactions for user', {
      userId,
      customerId,
      limit,
      offset,
      from,
      to,
      desc,
      transactionId,
      onlyInstallmentCharges,
    });

    const response =
      await TransactionsBackofficeService.getCustomerTransactions(
        {
          customer_id: customerId,
          limit,
          offset,
          from,
          to,
          desc,
          transaction_id: transactionId,
          only_installment_charges: onlyInstallmentCharges,
        },
        customerToken
      );

    const simplifiedTransactions =
      response.payload.transactions.map(simplifyTransaction);

    logger.info('Transactions fetched successfully', {
      count: simplifiedTransactions.length,
      totalCount: response.payload.totalCount,
    });

    return {
      transactions: simplifiedTransactions,
      totalCount: response.payload.totalCount,
    };
  }
}
