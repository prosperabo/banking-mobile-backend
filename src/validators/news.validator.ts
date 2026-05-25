import { body, query, param } from 'express-validator';

export const getNewsValidator = [
  query('appVersion')
    .optional()
    .isString()
    .withMessage('appVersion must be a string')
    .isLength({ min: 1, max: 20 })
    .withMessage('appVersion must be between 1 and 20 characters')
    .trim(),
];

export const createNewsValidator = [
  query('appVersion')
    .optional()
    .isString()
    .withMessage('appVersion must be a string')
    .isLength({ min: 1, max: 20 })
    .withMessage('appVersion must be between 1 and 20 characters')
    .trim(),
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description must be between 1 and 2000 characters')
    .trim(),
  body('redirectUrl')
    .optional()
    .isURL()
    .withMessage('redirectUrl must be a valid URL'),
];

export const publishNewsValidator = [
  param('id')
    .notEmpty()
    .withMessage('News id is required')
    .isString()
    .withMessage('News id must be a string')
    .trim(),
];
