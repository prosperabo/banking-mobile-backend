import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserWalletService } from '@/services/userWallet.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';

const logger = buildLogger('UserWalletController');

export class DefindexWalletController {
  static createWallet = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    logger.info('createWallet called', { userId });

    const wallet = await UserWalletService.createOrGetWallet(userId);

    return successHandler(
      res,
      { wallet },
      'Wallet created successfully',
      StatusCodes.CREATED
    );
  });

  static getMyWallet = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    logger.info('getMyWallet called', { userId });

    const wallet = await UserWalletService.getWalletByUser(userId);

    return successHandler(res, { wallet }, 'Wallet fetched successfully');
  });
}
