import { body } from 'express-validator';

export const assignUsersToProgramValidator = [
  body('program_code')
    .isString()
    .withMessage('program_code must be a string')
    .notEmpty()
    .withMessage('program_code is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('program_code must be between 1 and 50 characters'),
  body('customer_ids')
    .isArray({ min: 1 })
    .withMessage('customer_ids must be a non-empty array')
    .custom(value => {
      return value.every((id: unknown) => typeof id === 'number' && id > 0);
    })
    .withMessage('customer_ids must be an array of positive numbers'),
];
