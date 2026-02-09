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
    .optional()
    .isLength({ min: 4, max: 6 })
    .withMessage('PIN must be between 4 and 6 characters long')
    .bail()
    .matches(/^\d+$/)
    .withMessage('PIN must contain only digits'),
];

const createVirtualCardValidator = [
  body('campaign_id')
    .optional()
    .isString()
    .withMessage('Campaign ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Campaign ID must not exceed 100 characters'),
];

const requestPhysicalCardValidator = [
  // Delivery type validation
  body('deliveryType')
    .notEmpty()
    .withMessage('Delivery type is required')
    .isIn(['home', 'slan'])
    .withMessage('Delivery type must be either "home" or "slan"'),

  // Billing address validations - required only for 'home' delivery
  body('billingAddress.firstName')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('First name is required for home delivery')
    .isString()
    .withMessage('First name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must not exceed 100 characters'),

  body('billingAddress.lastName')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('Last name is required for home delivery')
    .isString()
    .withMessage('Last name must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must not exceed 100 characters'),

  body('billingAddress.street')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('Street is required for home delivery')
    .isString()
    .withMessage('Street must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Street must not exceed 255 characters'),

  body('billingAddress.exteriorNumber')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('Exterior number is required for home delivery')
    .isString()
    .withMessage('Exterior number must be a string')
    .isLength({ min: 1, max: 20 })
    .withMessage('Exterior number must not exceed 20 characters'),

  body('billingAddress.interiorNumber')
    .optional()
    .isString()
    .withMessage('Interior number must be a string')
    .isLength({ max: 20 })
    .withMessage('Interior number must not exceed 20 characters'),

  body('billingAddress.neighborhood')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('Neighborhood (colonia) is required for home delivery')
    .isString()
    .withMessage('Neighborhood must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Neighborhood must not exceed 255 characters'),

  body('billingAddress.city')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('City is required for home delivery')
    .isString()
    .withMessage('City must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('City must not exceed 100 characters'),

  body('billingAddress.state')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('State is required for home delivery')
    .isString()
    .withMessage('State must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('State must not exceed 100 characters'),

  body('billingAddress.postalCode')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('Postal code is required for home delivery')
    .isString()
    .withMessage('Postal code must be a string')
    .matches(/^\d{5}$/)
    .withMessage('Postal code must be exactly 5 digits'),

  body('billingAddress.phone')
    .if(body('deliveryType').equals('home'))
    .notEmpty()
    .withMessage('Phone is required for home delivery')
    .isString()
    .withMessage('Phone must be a string')
    .matches(/^\d{10}$/)
    .withMessage('Phone must be exactly 10 digits'),

  body('billingAddress.additionalNotes')
    .optional()
    .isString()
    .withMessage('Additional notes must be a string')
    .isLength({ max: 500 })
    .withMessage('Additional notes must not exceed 500 characters'),

  // Pickup location validation
  body('pickupLocation')
    .optional()
    .isString()
    .withMessage('Pickup location must be a string')
    .isLength({ max: 255 })
    .withMessage('Pickup location must not exceed 255 characters'),
];

export {
  activateCardValidator,
  createVirtualCardValidator,
  stopCardValidator,
  unstopCardValidator,
  cardIdParamValidator,
  cardPinQueryValidator,
  requestPhysicalCardValidator,
};
