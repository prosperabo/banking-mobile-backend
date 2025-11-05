import { Response, NextFunction } from 'express';

import { CardRepository } from '@/repositories/card.repository';
import { CardBackofficeService } from '@/services/card.backoffice.service';
import { buildLogger } from '@/utils';
import {
  NotFoundError,
  InternalServerError,
  UnauthorizedError,
} from '@/shared/errors';
import { AuthenticatedRequest } from '@/types/authenticated-request';

const logger = buildLogger('validateCardPin');

export const validateCardPin = () => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const pinQuery = req.query.pin as string;
    const cardId = Number(req.params.cardId);

    logger.info('Validating card PIN', { cardId });

    const card = await CardRepository.getCardById(cardId);

    logger.info('Fetched card from DB', { cardId, cardExists: !!card });

    if (!card || !card.prosperaCardId) {
      logger.error('Card not found or missing prosperaCardId in DB', {
        cardId,
      });
      throw new NotFoundError('Invalid card');
    }

    if (card.cardType !== 'PHYSICAL') {
      logger.info('Card is not physical, skipping PIN validation', {
        cardId,
        cardType: card.cardType,
      });
      return next();
    }

    const pinResp = await CardBackofficeService.viewPinForCustomer(
      Number(card.prosperaCardId),
      req.backoffice.customer_oauth_token
    );

    const remotePin = pinResp.payload?.pin;

    logger.info('Validating pin for card', {
      cardId,
      remotePinExists: !!remotePin,
    });

    if (!remotePin) {
      logger.error('Pin not found in backoffice response', { pinResp });
      throw new InternalServerError('Unable to retrieve pin for card');
    }

    if (String(remotePin) !== String(pinQuery)) {
      logger.warn('Provided pin does not match remote pin', {
        providedPin: pinQuery,
      });
      throw new UnauthorizedError('Invalid PIN');
    }

    return next();
  };
};
