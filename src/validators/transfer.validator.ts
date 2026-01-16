import { body, query } from 'express-validator';

export const transferValidator = [
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('target')
    .notEmpty()
    .withMessage('Target is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Target must be between 3 and 255 characters'),
  body('description')
    .optional()
    .isObject()
    .withMessage('Description must be a valid JSON object'),
];
export const transferTypeQueryValidator = [
  query('transferType')
    .notEmpty()
    .withMessage('Transfer type is required')
    .isIn(['email', 'alias'])
    .withMessage('Transfer type must be either email or alias'),
];
