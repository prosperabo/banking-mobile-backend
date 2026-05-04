import { body } from 'express-validator';

export const createSipQrValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('amount debe ser mayor a 0'),
  body('netAmountMxn')
    .optional({ nullable: true })
    .isFloat({ min: 0.01 })
    .withMessage('netAmountMxn debe ser un número positivo'),
  body('currency')
    .isIn(['BOB', 'USD'])
    .withMessage('currency debe ser BOB o USD'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('description no puede superar 255 caracteres'),
];

export const sipCallbackValidator = [
  body('alias').isString().notEmpty().withMessage('alias es requerido'),
  body('monto')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('monto debe ser numérico y >= 0'),
  body('moneda').optional().isString().withMessage('moneda debe ser string'),
  body('idQr').optional().isString(),
  body('numeroOrdenOriginante').optional().isString(),
  body('fechaproceso')
    .optional()
    .isNumeric()
    .withMessage('fechaproceso debe ser un timestamp numérico'),
  body('cuentaCliente').optional().isString(),
  body('nombreCliente').optional().isString(),
  body('documentoCliente').optional().isString(),
];
