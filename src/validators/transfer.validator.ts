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

export const speiCashoutValidator = [
  body('clabe')
    .notEmpty()
    .withMessage('CLABE is required')
    .isLength({ min: 18, max: 18 })
    .withMessage('CLABE must be 18 digits')
    .matches(/^\d{18}$/)
    .withMessage('CLABE must contain only digits'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a non-negative number'),
  body('receiverName')
    .optional()
    .isString()
    .withMessage('Receiver name must be a string')
    .isLength({ min: 3, max: 255 })
    .withMessage('Receiver name must be between 3 and 255 characters'),
  body('entityName')
    .optional()
    .isString()
    .withMessage('Entity name must be a string')
    .isLength({ min: 2, max: 255 })
    .withMessage('Entity name must be between 2 and 255 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 255 })
    .withMessage('Description must not exceed 255 characters'),
];

export const transferTypeQueryValidator = [
  query('transferType')
    .notEmpty()
    .withMessage('Transfer type is required')
    .isIn(['email', 'alias'])
    .withMessage('Transfer type must be either email or alias'),
];
