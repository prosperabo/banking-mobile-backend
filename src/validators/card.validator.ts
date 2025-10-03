import { param, body } from 'express-validator';

const validateActivateCard = [
  param('cardId')
    .isInt({ gt: 0 })
    .withMessage('Card ID must be a positive integer'),
  body('pin')
    .isString()
    .withMessage('PIN must be a string')
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be between 4 and 6 characters long'),
];

export { validateActivateCard };
