import { Request, Response } from 'express';
import { TransactionsService } from '@/services/transactions.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { RangeTransactionType } from '../shared/consts/rangeTransaction';

const logger = buildLogger('TransactionsController');

export class TransactionsController {
  static getUserTransactions = catchErrors(
    async (req: Request, res: Response) => {
      const userId = req.user!.userId;
      const { customer_oauth_token: customerToken, customerId } =
        req.backoffice!;
      const {
        limit = 100,
        offset,
        from,
        to,
        desc = true,
        transaction_id: transactionId,
        only_installment_charges: onlyInstallmentCharges = false,
      } = req.query;

      logger.info('Fetching user transactions', {
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

      const result = await TransactionsService.getUserTransactions(
        userId,
        customerToken,
        customerId,
        Number(limit),
        offset ? Number(offset) : undefined,
        from as string | undefined,
        to as string | undefined,
        desc === 'true',
        transactionId ? Number(transactionId) : undefined,
        onlyInstallmentCharges === 'true'
      );

      logger.info('User transactions fetched successfully', {
        count: result.transactions.length,
        totalCount: result.totalCount,
      });

      return successHandler(res, result, 'Transactions fetched successfully');
    }
  );

  static getTransactionChartData = catchErrors(
    async (req: Request, res: Response) => {
      const userId = req.user!.userId;
      const { customer_oauth_token: customerToken, customerId } =
        req.backoffice!;

      const {
        range_type: rangeType,
        only_installment_charges: onlyInstallmentCharges = false,
      } = req.query;

      logger.info('Fetching transaction chart data', {
        userId,
        customerId,
        rangeType,
        onlyInstallmentCharges,
      });
      const result = await TransactionsService.getTransactionsByMonthDate(
        userId,
        customerToken,
        customerId,
        1000,
        undefined,
        undefined,
        undefined,
        true,
        undefined,
        onlyInstallmentCharges === 'true',
        rangeType as RangeTransactionType
      );

      logger.info('Chart data fetched successfully', {
        type: result.type,
        totalBalance: result.totalBalance,
        dataPoints: result.chartData.length,
      });

      return successHandler(res, result, 'Chart data fetched successfully');
    }
  );
}
