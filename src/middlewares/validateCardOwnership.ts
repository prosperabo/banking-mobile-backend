import { Request, Response, NextFunction } from 'express';
import { CardRepository } from '@/repositories/card.repository';
import { buildLogger } from '@/utils';
import { NotFoundError, ForbiddenError } from '@/shared/errors';

const logger = buildLogger('validateCardOwnership');

export const validateCardOwnership = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cardId = Number(req.params.cardId);
    const userId = req.user!.userId;

    logger.info('Checking card ownership', {
      cardId,
      userId: userId,
    });

    const card = await CardRepository.getCardById(cardId);

    logger.info('Fetched card from DB', { cardId, cardExists: !!card });

    if (!card) {
      logger.error('Card not found', { cardId });
      throw new NotFoundError('Card inválida');
    }

    if (card.userId !== userId) {
      logger.warn('Card does not belong to authenticated user', {
        cardId,
        userId,
      });
      throw new ForbiddenError('Unauthorized access to card');
    }

    return next();
  };
};
