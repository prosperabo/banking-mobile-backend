import { Request, Response } from 'express';

import { CardService } from '@/services/card.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { ActivateCardRequest } from '@/schemas/card.schemas';
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
}
