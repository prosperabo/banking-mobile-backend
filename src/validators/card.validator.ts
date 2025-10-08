import { param, body, query } from 'express-validator';

const activateCardValidator = [
  body('pin')
    .isString()
    .withMessage('PIN must be a string')
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be between 4 and 6 characters long'),
];

const stopCardValidator = [
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string')
    .isLength({ max: 255 })
    .withMessage('Note must not exceed 255 characters'),
];

const unstopCardValidator = [
  body('note')
    .optional()
    .isString()
    .withMessage('Note must be a string')
    .isLength({ max: 255 })
    .withMessage('Note must not exceed 255 characters'),
];

const cardIdParamValidator = [
  param('cardId')
    .isInt({ gt: 0 })
    .withMessage('Card ID must be a positive integer'),
];

const cardPinQueryValidator = [
  query('pin')
    .exists()
    .withMessage('PIN is required')
    .bail()
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be between 4 and 6 characters long')
    .bail()
    .matches(/^\d+$/)
    .withMessage('PIN must contain only digits'),
];

export {
  activateCardValidator,
  stopCardValidator,
  unstopCardValidator,
  cardIdParamValidator,
  cardPinQueryValidator,
};
