import { RangeTransactionType } from '../shared/consts/rangeTransaction';
import { ApiResponse } from './api.backoffice.schemas';

export interface MerchantCategoryCode {
  mcc: string;
  description: string;
  categoryId: number;
  category: string;
  subcategoryId: number;
  subcategory: string;
}

export interface SimplifiedTransaction {
  id: number;
  date: string;
  title: string;
  category: string;
  amount: number;
}

export interface ChartDataPoint {
  label: string; // Ej: "L", "M" (Diario) o "Ago", "Sep" (Mensual)
  date: string; // Fecha ISO (YYYY-MM-DD) o Mes (YYYY-MM) para referencia
  amount: number; // El gasto total acumulado
  previousIncrementPercentage: number; // % vs el dato anterior (+21, -19, etc.)
  isCurrent: boolean; // True si es el día de hoy o el mes actual
}

export interface TransactionChartResponse {
  type: RangeTransactionType;
  totalBalance: number; // Suma total del periodo (para mostrar el "$5,230" grande)
  chartData: ChartDataPoint[];
}

export interface TransactionDetails {
  amount: string;
  timestamp: string;
  transactionType: number;
  status: number;
  transactionId: number;
  description: string;
  merchantCategoryCode: MerchantCategoryCode;
  referenceId?: number;
  captureMode: string;
  MDESDigitizedWalletID: string;
  isSettled: boolean;
  category: number;
  installments?: {
    totalCount: number;
  };
}

export interface GetTransactionsParams {
  customer_id: number;
  limit: number;
  offset?: number;
  from?: string;
  to?: string;
  desc?: boolean;
  transaction_id?: number;
  only_installment_charges?: boolean;
}

export interface GetTransactionsResponsePayload {
  transactions: TransactionDetails[];
  totalCount: number;
}

export type GetTransactionsResponse =
  ApiResponse<GetTransactionsResponsePayload>;
