import { Request, Response } from 'express';

import { CardService } from '@/services/card.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import {
  ActivateCardRequest,
  StopCardRequest,
  UnstopCardRequest,
} from '@/schemas/card.schemas';
import { buildLogger } from '@/utils';

const logger = buildLogger('CardController');

export class CardController {
  static getUserCards = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    logger.info('Fetching user cards', { userId });

    const cards = await CardService.getUserCards(userId);
    logger.info('User cards fetched successfully', { cards });

    return successHandler(res, { cards }, 'Cards fetched successfully');
  });

  static activateCard = catchErrors(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    const { pin }: ActivateCardRequest = req.body;
    const { customer_oauth_token: customerToken, customerId } = req.backoffice!;

    logger.info('Activating card', { cardId, pin, customerToken });

    const result = await CardService.activateCard(
      Number(cardId),
      pin,
      customerToken,
      customerId
    );

    logger.info('Card activated successfully', { result });

    return successHandler(res, result, 'Card activated successfully');
  });

  static getCardDetailsById = catchErrors(
    async (req: Request, res: Response) => {
      const { cardId } = req.params;
      const { customer_oauth_token: customerToken, customerId } =
        req.backoffice!;

      logger.info('Fetching card details by ID', { cardId, customerId });

      const cardDetails = await CardService.getCardDetailsById(
        Number(cardId),
        customerToken,
        customerId
      );

      logger.info('Card details fetched successfully', { cardDetails });

      return successHandler(
        res,
        cardDetails,
        'Card details fetched successfully'
      );
    }
  );

  static stopCard = catchErrors(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    const { note }: StopCardRequest = req.body;
    const { customer_oauth_token: customerToken, customerId } = req.backoffice!;

    logger.info('Stopping card', { cardId, note, customerId });

    const result = await CardService.stopCard(
      Number(cardId),
      customerToken,
      customerId,
      note || 'Card stopped by user request'
    );

    logger.info('Card stopped successfully', { result });

    return successHandler(res, result, 'Card stopped successfully');
  });

  static unstopCard = catchErrors(async (req: Request, res: Response) => {
    const { cardId } = req.params;
    const { note }: UnstopCardRequest = req.body;
    const { customer_oauth_token: customerToken, customerId } = req.backoffice!;

    logger.info('Unstopping card', { cardId, note, customerId });

    const result = await CardService.unstopCard(
      Number(cardId),
      customerToken,
      customerId,
      note || 'Card unblocked by user request'
    );

    logger.info('Card unstopped successfully', { result });

    return successHandler(res, result, 'Card unstopped successfully');
  });

  static getCardInfo = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Getting card info for user', { userId });

    const result = await CardService.getUserCardInfo(userId);

    logger.info('Card debt info retrieved successfully', { userId });
    return successHandler(
      res,
      result,
      'Card debt information retrieved successfully'
    );
  });
}
