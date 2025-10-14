import { body } from 'express-validator';

export const updateUserValidator = [
  body('completeName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('El nombre debe tener entre 1 y 255 caracteres'),
  body('phone')
    .optional()
    .isLength({ min: 10, max: 20 })
    .withMessage('El teléfono debe tener entre 10 y 20 caracteres'),
  body('birthCountry')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El país de nacimiento debe tener entre 1 y 100 caracteres'),
  body('postalCode')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('El código postal debe tener entre 1 y 10 caracteres'),
  body('state')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El estado debe tener entre 1 y 100 caracteres'),
  body('country')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El país debe tener entre 1 y 100 caracteres'),
  body('municipality')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El municipio debe tener entre 1 y 100 caracteres'),
  body('street')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('La calle debe tener entre 1 y 255 caracteres'),
  body('colony')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('La colonia debe tener entre 1 y 100 caracteres'),
  body('externalNumber')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('El número exterior debe tener entre 1 y 20 caracteres'),
  body('internalNumber')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('El número interior debe tener entre 1 y 20 caracteres'),
  body('occupation')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('La ocupación debe tener entre 1 y 100 caracteres'),
  body('sector')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El sector debe tener entre 1 y 100 caracteres'),
  body('mainActivity')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('La actividad principal debe tener entre 1 y 255 caracteres'),
  body('monthlyIncome')
    .optional()
    .isNumeric()
    .withMessage('El ingreso mensual debe ser un número'),
  body('monthlyOutcome')
    .optional()
    .isNumeric()
    .withMessage('El egreso mensual debe ser un número'),
  body('hasOtherCreditCards')
    .optional()
    .isBoolean()
    .withMessage('¿Tiene otras tarjetas? debe ser un valor booleano'),
  body('universityRegistration')
    .optional()
    .isInt({ min: 0 })
    .withMessage(
      'El registro universitario debe ser un número entero positivo'
    ),
  body('creditLimit')
    .optional()
    .isNumeric()
    .withMessage('El límite de crédito debe ser un número'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('La tasa de interés debe estar entre 0 y 100'),
  body('paymentDates')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Las fechas de pago deben tener entre 1 y 255 caracteres'),
  body('initialDeposit')
    .optional()
    .isNumeric()
    .withMessage('El depósito inicial debe ser un número'),
  body('rfc')
    .optional()
    .isLength({ min: 13, max: 13 })
    .withMessage('El RFC debe tener exactamente 13 caracteres'),
];
