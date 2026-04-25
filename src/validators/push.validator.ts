import { body } from 'express-validator';

export const registerDeviceValidator = [
  body('fcmToken')
    .notEmpty()
    .withMessage('fcmToken is required')
    .isString()
    .withMessage('fcmToken must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('fcmToken must be between 1 and 255 characters'),
  body('platform')
    .notEmpty()
    .withMessage('platform is required')
    .isIn(['ANDROID', 'IOS'])
    .withMessage('platform must be ANDROID or IOS'),
  body('deviceId')
    .optional()
    .isString()
    .withMessage('deviceId must be a string')
    .isLength({ max: 64 })
    .withMessage('deviceId must not exceed 64 characters'),
  body('appVersion')
    .optional()
    .isString()
    .withMessage('appVersion must be a string')
    .isLength({ max: 32 })
    .withMessage('appVersion must not exceed 32 characters'),
];
