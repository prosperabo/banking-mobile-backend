import {
  SimplifiedTransaction,
  TransactionDetails,
} from '@/schemas/transactions.schemas';

export const formatTransactionTitle = (
  transaction: TransactionDetails
): string => {
  const merchantName = transaction.merchantCategoryCode?.description;
  // Remove quotes from description if present
  const cleanDescription = transaction.description.replace(/^"|"$/g, '');
  return merchantName || cleanDescription;
};

export const formatTransactionAmount = (
  amount: string,
  category: number
): number => {
  const numericAmount = Number(amount);
  // Category 1 represents DEDUCT transactions (negative amount)
  return category === 1 ? -numericAmount : numericAmount;
};

export const formatTransactionCategory = (
  merchantCategoryCode: TransactionDetails['merchantCategoryCode']
): string => {
  return (merchantCategoryCode?.category || '').trim();
};

export const simplifyTransaction = (
  transaction: TransactionDetails
): SimplifiedTransaction => {
  return {
    id: transaction.transactionId,
    date: transaction.timestamp,
    title: formatTransactionTitle(transaction),
    category: formatTransactionCategory(transaction.merchantCategoryCode),
    amount: formatTransactionAmount(transaction.amount, transaction.category),
  };
};
