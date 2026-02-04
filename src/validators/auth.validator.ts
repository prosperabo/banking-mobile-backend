import { body } from 'express-validator';

export const registerValidator = [
  body('email')
    .isEmail()
    .withMessage('Must provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('First name must be between 1 and 255 characters')
    .trim(),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Last name must be between 1 and 255 characters')
    .trim(),
  body('secondLastName')
    .notEmpty()
    .withMessage('Second last name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Second last name must be between 1 and 255 characters')
    .trim(),
  body('curp')
    .notEmpty()
    .withMessage('CURP is required')
    .isLength({ min: 18, max: 18 })
    .withMessage('CURP must be exactly 18 characters')
    .matches(/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9]{2}$/)
    .withMessage('CURP format is invalid')
    .trim()
    .toUpperCase(),
  body('birthDate')
    .notEmpty()
    .withMessage('Birth date is required')
    .isISO8601()
    .withMessage('Birth date must be a valid date')
    .toDate(),
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['MASCULINO', 'FEMENINO'])
    .withMessage('Gender must be MASCULINO or FEMENINO'),
  body('nationality')
    .notEmpty()
    .withMessage('Nationality is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Nationality must be between 1 and 255 characters')
    .trim(),
  body('countryCode')
    .notEmpty()
    .withMessage('Country code is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Country code must be between 1 and 10 characters')
    .trim(),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone must be between 10 and 20 characters'),
  body('rfc')
    .optional()
    .isLength({ min: 12, max: 13 })
    .withMessage('RFC must be 12 or 13 characters')
    .matches(/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/)
    .withMessage('RFC format is invalid')
    .trim()
    .toUpperCase(),
  body('street')
    .notEmpty()
    .withMessage('Street is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Street must be between 1 and 255 characters')
    .trim(),
  body('externalNumber')
    .notEmpty()
    .withMessage('External number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('External number must be between 1 and 20 characters')
    .trim(),
  body('internalNumber')
    .notEmpty()
    .withMessage('Internal number is required')
    .isLength({ min: 1, max: 20 })
    .withMessage('Internal number must be between 1 and 20 characters')
    .trim(),
  body('colony')
    .notEmpty()
    .withMessage('Colony is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Colony must be between 1 and 100 characters')
    .trim(),
  body('municipality')
    .notEmpty()
    .withMessage('Municipality is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Municipality must be between 1 and 100 characters')
    .trim(),
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('State must be between 1 and 100 characters')
    .trim(),
  body('monthlyIncomeRange')
    .notEmpty()
    .withMessage('Monthly income range is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Monthly income range must be between 1 and 255 characters')
    .trim(),
  body('isUniversityStudent')
    .notEmpty()
    .withMessage('University student status is required')
    .isBoolean()
    .withMessage('University student status must be a boolean')
    .toBoolean(),
  body('universityRegistration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('University registration must be a positive integer')
    .toInt(),
  body('universityProfilePhotoLink')
    .optional()
    .isURL()
    .withMessage('University profile photo link must be a valid URL'),
  body('documentScan')
    .optional()
    .isURL()
    .withMessage('Document scan must be a valid URL'),
  body('academicInfo.actualSemester')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Actual semester must be between 1 and 20')
    .toInt(),
  body('academicInfo.academicArea')
    .optional()
    .isIn([
      'STEM',
      'NEGOCIOS_ECONOMIA',
      'SALUD',
      'CIENCIAS_SOCIALES',
      'ARTES_HUMANIDADES',
      'EDUCACION',
      'DERECHO',
    ])
    .withMessage('Invalid academic area'),
  body('academicInfo.scholarshipPercentageRange')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage(
      'Scholarship percentage range must be between 1 and 255 characters'
    )
    .trim(),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password required'),
];

export const registerByEmailValidator = [
  body('email')
    .isEmail()
    .withMessage('Must provide a valid email')
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
    }),
];
