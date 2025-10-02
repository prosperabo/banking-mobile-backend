import { Request, Response } from 'express';

import { AuthService } from '@/services/auth.service';
import { LoginRequest } from '@/schemas/auth.schemas';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';

const logger = buildLogger('auth-controller');

export class AuthController {
  static login = catchErrors(async (req: Request, res: Response) => {
    logger.info('Login attempt', { body: req.body });

    const loginData: LoginRequest = req.body;
    const result = await AuthService.login(loginData);

    logger.info('Login successful');
    successHandler(res, result, 'Login successful');
  });
}
