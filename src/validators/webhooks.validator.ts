import { body } from 'express-validator';

export const bulkOrderCardNotificationValidator = [
  body('numCreated')
    .isInt({ min: 0 })
    .withMessage('numCreated must be an integer greater than or equal to 0'),
  body('numFailed')
    .isInt({ min: 0 })
    .withMessage('numFailed must be an integer greater than or equal to 0'),
  body('referenceBatch')
    .isString()
    .notEmpty()
    .withMessage('referenceBatch is required and must be a string'),
  body('status')
    .isInt({ min: 0 })
    .withMessage('status must be an integer greater than or equal to 0'),
];
