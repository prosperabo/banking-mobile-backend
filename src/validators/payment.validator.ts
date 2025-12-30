import { body, param } from 'express-validator';

export const createPaymentValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isIn(['MXN', 'USD'])
    .withMessage('Currency must be MXN or USD'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
];

export const processPaymentValidator = [
  body('card_token')
    .isString()
    .notEmpty()
    .withMessage('Card token is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('currency')
    .optional()
    .isIn(['MXN', 'USD'])
    .withMessage('Currency must be MXN or USD'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
  body('customer.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('customer.phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string'),
];

export const paymentIdParamValidator = [
  param('paymentId')
    .isInt({ min: 1 })
    .withMessage('Payment ID must be a positive integer'),
];
