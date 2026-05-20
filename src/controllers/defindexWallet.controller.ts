import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { DefindexWalletService } from '@/services/defindexWallet.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';

const logger = buildLogger('DefindexWalletController');

export class DefindexWalletController {
  static createWallet = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    logger.info('createWallet called', { userId });

    const wallet = await DefindexWalletService.createOrGetWallet(userId);

    return successHandler(res, { wallet }, 'Wallet created successfully', StatusCodes.CREATED);
  });

  static getMyWallet = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    logger.info('getMyWallet called', { userId });

    const wallet = await DefindexWalletService.getWalletByUser(userId);

    return successHandler(res, { wallet }, 'Wallet fetched successfully');
  });
}
