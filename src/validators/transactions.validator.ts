import { query } from 'express-validator';

const getTransactionsValidator = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a number between 1 and 100')
    .default(100),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('from')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}(\+\d{2}:\d{2}:\d{2})?$/)
    .withMessage(
      'From date must be in format YYYY-MM-DD or YYYY-MM-DD+HH:mm:ss'
    ),
  query('to')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}(\+\d{2}:\d{2}:\d{2})?$/)
    .withMessage('To date must be in format YYYY-MM-DD or YYYY-MM-DD+HH:mm:ss'),
  query('desc')
    .optional()
    .isBoolean()
    .withMessage('Desc must be a boolean')
    .default(false),
  query('transaction_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Transaction ID must be a positive integer'),
  query('only_installment_charges')
    .optional()
    .isBoolean()
    .withMessage('Only installment charges must be a boolean')
    .default(false),
];

export { getTransactionsValidator };
