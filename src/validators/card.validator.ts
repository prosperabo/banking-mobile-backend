import { param, body } from 'express-validator';

const activateCardValidator = [
  body('pin')
    .isString()
    .withMessage('PIN must be a string')
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be between 4 and 6 characters long'),
];

const cardIdParamValidator = [
  param('cardId')
    .isInt({ gt: 0 })
    .withMessage('Card ID must be a positive integer'),
];

export { activateCardValidator, cardIdParamValidator };
