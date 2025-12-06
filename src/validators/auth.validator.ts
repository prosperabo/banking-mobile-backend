import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Must provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('completeName')
    .notEmpty()
    .withMessage('Complete name is required')
    .trim(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone('es-MX') // Assuming Mexico based on other code
    .withMessage('Must provide a valid phone number'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password required'),
];
