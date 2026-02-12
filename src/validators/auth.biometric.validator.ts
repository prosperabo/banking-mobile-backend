import { body } from 'express-validator';

export const biometricEnrollValidator = [
  body('deviceId').isString().isLength({ min: 10, max: 64 }),
  body('publicKey').notEmpty().withMessage('publicKey is required'),
  body('algorithm').optional().isIn(['ES256']),
  body('deviceName').optional().isString().isLength({ max: 128 }),
  body('platform').optional().isIn(['ios', 'android']),
  body('appVersion').optional().isString().isLength({ max: 32 }),
];

export const biometricChallengeValidator = [
  body('deviceId').isString().isLength({ min: 10, max: 64 }),
];

export const biometricVerifyValidator = [
  body('deviceId').isString().isLength({ min: 10, max: 64 }),
  body('challengeId').isString().isLength({ min: 26, max: 26 }),
  body('signature').isString().isLength({ min: 20 }),
];
