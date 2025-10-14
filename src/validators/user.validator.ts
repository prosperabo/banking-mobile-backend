import { body } from 'express-validator';

export const updateUserValidator = [
  body('completeName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Complete name must be between 1 and 255 characters'),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  body('birthCountry')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Birth country must be between 1 and 100 characters'),
  body('postalCode')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Postal code must be between 1 and 10 characters'),
  body('state')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters'),
  body('country')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1 and 100 characters'),
  body('municipality')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Municipality must be between 1 and 100 characters'),
  body('street')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Street must be between 1 and 255 characters'),
  body('colony')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Colony must be between 1 and 100 characters'),
  body('externalNumber')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('External number must be between 1 and 20 characters'),
  body('internalNumber')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Internal number must be between 1 and 20 characters'),
  body('occupation')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Occupation must be between 1 and 100 characters'),
  body('sector')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Sector must be between 1 and 100 characters'),
  body('mainActivity')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Main activity must be between 1 and 255 characters'),
  body('monthlyIncome')
    .optional()
    .isNumeric()
    .withMessage('Monthly income must be a number'),
  body('monthlyOutcome')
    .optional()
    .isNumeric()
    .withMessage('Monthly outcome must be a number'),
  body('hasOtherCreditCards')
    .optional()
    .isBoolean()
    .withMessage('Has other credit cards must be a boolean value'),
  body('universityRegistration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('University registration must be a positive integer'),
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('Credit limit must be a number'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Interest rate must be between 0 and 100'),
  body('paymentDates')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Payment dates must be between 1 and 255 characters'),
  body('initialDeposit')
    .optional()
    .isNumeric()
    .withMessage('Initial deposit must be a number'),
  body('rfc')
    .optional()
    .isLength({ min: 13, max: 13 })
    .withMessage('RFC must be exactly 13 characters'),
];
