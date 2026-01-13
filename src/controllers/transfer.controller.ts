import { Request, Response } from 'express';
import { TransferService } from '@/services/transfer.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { TransferRequest } from '@/schemas/transfer.schemas';

const logger = buildLogger('TransferController');

export class TransferController {
  /**
   * Transfer funds to email or alias
   */
  static transfer = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { customer_oauth_token: customerToken, customerId } = req.backoffice!;
    const transferData: TransferRequest = req.body;
    const { transferType = 'email' } = req.query;

    logger.info('Processing transfer', {
      userId,
      target: transferData.target,
      transferType,
      amount: transferData.amount,
    });

    const result = await TransferService.transfer(
      userId,
      transferData,
      customerToken,
      customerId,
      transferType as 'email' | 'alias'
    );

    logger.info('Transfer completed successfully', {
      userId,
      target: transferData.target,
    });

    return successHandler(res, result, 'Transfer completed successfully');
  });

  /**
   * Get user QR code
   */
  static getUserQR = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Getting QR code for user', { userId });

    const result = await TransferService.getUserQR(userId);

    logger.info('QR code retrieved successfully', { userId });

    return successHandler(res, result, 'QR code retrieved successfully');
  });
}
