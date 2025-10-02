import { Request, Response } from 'express';
import { CardService } from '@/services/card.service';
import { successHandler } from '@/shared/handlers/successHandler';
import { catchErrors } from '@/shared/handlers/errorHandler';

export const CardController = {
  getUserCards: catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const cards = await CardService.getUserCards(userId);
    return successHandler(res, { cards }, 'Cards fetched successfully');
  }),
};
