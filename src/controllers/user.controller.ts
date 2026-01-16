import { Request, Response } from 'express';

import { UserService } from '@/services/user.service';
import {
  UpdateUserRequest,
  ChangePasswordRequest,
  AddAliasRequest,
} from '@/schemas/user.schemas';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';

const logger = buildLogger('user-controller');

export class UserController {
  static getUser = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Getting user data', { userId });

    const result = await UserService.getUserById(userId);

    logger.info('User data retrieved successfully', { userId });
    successHandler(res, result, 'User data retrieved successfully');
  });

  static updateUser = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Updating user', { userId, body: req.body });

    const updateData: UpdateUserRequest = req.body;
    const result = await UserService.updateUser(userId, updateData);

    logger.info('User updated successfully', { userId });
    successHandler(res, result, 'User updated successfully');
  });

  static changePassword = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Changing password for user', { userId });

    const passwordData: ChangePasswordRequest = req.body;
    const result = await UserService.changePassword(userId, passwordData);

    logger.info('Password changed successfully', { userId });
    successHandler(res, result, 'Password changed successfully');
  });

  static addAlias = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Adding alias for user', { userId, body: req.body });

    const aliasData: AddAliasRequest = req.body;
    const result = await UserService.addAlias(userId, aliasData);

    logger.info('Alias added successfully', { userId });
    successHandler(res, result, 'Alias added successfully');
  });
}
