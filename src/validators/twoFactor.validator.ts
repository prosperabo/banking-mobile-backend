import { body } from 'express-validator';

/**
 * Validates code during setup
 */
export const verifySetupValidator = [
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be exactly 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers'),
  body('secret')
    .trim()
    .notEmpty()
    .withMessage('Secret is required')
    .isLength({ min: 16 })
    .withMessage('Invalid secret format'),
];

/**
 * Validator to verify code during login
 */
export const verifyLoginCodeValidator = [
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be exactly 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers'),
];

/**
 * Validator to disable 2FA
 */
export const disableTwoFactorValidator = [
  body('password').trim().notEmpty().withMessage('Password is required'),
  body('code')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Code must be exactly 6 digits')
    .isNumeric()
    .withMessage('Code must contain only numbers'),
];
