import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '@/services/auth.service';
import { LoginRequest } from '@/types/auth.types';
import { buildLogger } from '@/shared/utils';

const logger = buildLogger('auth-controller');

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array(),
        });
        return;
      }

      const loginData: LoginRequest = req.body;
      const result = await AuthService.login(loginData);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result,
      });
    } catch (error) {
      logger.error('Login error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const errorMessage =
        error instanceof Error ? error.message : 'Error interno del servidor';
      const statusCode =
        errorMessage === 'Credenciales inválidas'
          ? StatusCodes.UNAUTHORIZED
          : StatusCodes.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }
  }
}
