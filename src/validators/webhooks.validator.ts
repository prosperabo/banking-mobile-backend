import { body } from 'express-validator';

export const cardEventValidator = [
  body('event_id').isString().notEmpty().withMessage('event_id es requerido'),
  body('type').isString().notEmpty().withMessage('type es requerido'),
  body('occurred_at')
    .isString()
    .notEmpty()
    .withMessage('occurred_at es requerido'),
  body('data').not().isEmpty().withMessage('data es requerido'),
];
