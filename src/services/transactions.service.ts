import { buildLogger } from '@/utils';
import { TransactionsBackofficeService } from './transactions.backoffice.service';
import { simplifyTransaction } from '@/utils/transaction.utils';
import {
  ChartDataPoint,
  SimplifiedTransaction,
  TransactionChartResponse,
} from '@/schemas/transactions.schemas';
import {
  RangeTransaction,
  RangeTransactionType,
} from '../shared/consts/rangeTransaction';
// Use for Dev
// import { getMockTransactions } from '../utils/mockTransactions';

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

  /**
   * Construye la data para la vista SEMANAL (Lunes - Domingo)
   */
  private static buildDailyData(
    transactions: SimplifiedTransaction[],
    now: Date
  ): ChartDataPoint[] {
    const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    const todayStr = now.toISOString().split('T')[0];

    const amountsMap = new Map<string, number>();
    transactions.forEach(tx => {
      const dateKey = tx.date.split('T')[0];
      const amount = Number(tx.amount);
      amountsMap.set(dateKey, (amountsMap.get(dateKey) || 0) + amount);
    });

    const result: ChartDataPoint[] = [];

    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      const dateStr = currentDay.toISOString().split('T')[0];

      const isFuture =
        currentDay.setHours(0, 0, 0, 0) > now.setHours(0, 0, 0, 0);
      const isToday = dateStr === todayStr;

      let amount = isFuture ? 0 : amountsMap.get(dateStr) || 0;

      const label = dayLabels[currentDay.getDay()];

      let percentage = 0;
      if (i > 0) {
        const prevAmount = result[i - 1].amount;
        if (prevAmount > 0) {
          percentage = Math.round(((amount - prevAmount) / prevAmount) * 100);
        } else if (amount > 0) {
          percentage = 100;
        }
      }

      result.push({
        label,
        date: dateStr,
        amount,
        previousIncrementPercentage: percentage,
        isCurrent: isToday,
      });
    }

    return result;
  }

  private static buildMonthlyData(
    transactions: SimplifiedTransaction[],
    now: Date
  ): ChartDataPoint[] {
    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const amountsMap = new Map<string, number>();
    transactions.forEach(tx => {
      const monthKey = tx.date.substring(0, 7);
      const amount = Number(tx.amount);
      amountsMap.set(monthKey, (amountsMap.get(monthKey) || 0) + amount);
    });

    const result: ChartDataPoint[] = [];

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const amount = amountsMap.get(key) || 0;
      const isCurrent = key === currentMonthKey;
      const label = monthNames[d.getMonth()];

      let percentage = 0;
      if (result.length > 0) {
        const prevAmount = result[result.length - 1].amount;
        if (prevAmount > 0) {
          percentage = Math.round(((amount - prevAmount) / prevAmount) * 100);
        } else if (amount > 0) {
          percentage = 100;
        }
      }

      result.push({
        label,
        date: key,
        amount,
        previousIncrementPercentage: percentage,
        isCurrent,
      });
    }

    return result;
  }

  static async getTransactionsByMonthDate(
    userId: number,
    customerToken: string,
    customerId: number,
    limit: number = 1000,
    offset?: number,
    from?: string,
    to?: string,
    desc: boolean = true,
    transactionId?: number,
    onlyInstallmentCharges: boolean = false,
    rangeType?: RangeTransactionType
  ): Promise<TransactionChartResponse> {
    const { DAILY, MONTHLY } = RangeTransaction;
    const now = new Date();

    if (rangeType === DAILY) {
      const dayOfWeek = now.getDay();
      const distanceToMonday = (dayOfWeek + 6) % 7;

      const monday = new Date(now);
      monday.setDate(now.getDate() - distanceToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      from = monday.toISOString().split('T')[0];
      to = sunday.toISOString().split('T')[0];
    } else if (rangeType === MONTHLY) {
      const startMonth = new Date(now.getFullYear(), now.getMonth() - 4, 1);
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      from = startMonth.toISOString().split('T')[0];
      to = endMonth.toISOString().split('T')[0];
    }

    const { transactions } = await this.getUserTransactions(
      userId,
      customerToken,
      customerId,
      limit,
      offset,
      from,
      to,
      desc,
      transactionId,
      onlyInstallmentCharges
    );

    // Use for Dev
    // const transactions = getMockTransactions();

    let chartData: ChartDataPoint[] = [];

    if (rangeType === DAILY) {
      chartData = this.buildDailyData(transactions, now);
    } else if (rangeType === MONTHLY) {
      chartData = this.buildMonthlyData(transactions, now);
    }

    const totalBalance = chartData.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      type: rangeType || DAILY,
      totalBalance,
      chartData,
    };
  }
}
