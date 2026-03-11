import { Request, Response, NextFunction } from 'express';

import { CardRepository } from '@/repositories/card.repository';
import { CardBackofficeService } from '@/services/card.backoffice.service';
import { buildLogger } from '@/utils';
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@/shared/errors';

const logger = buildLogger('validateTransferCardPin');

export const validateTransferCardPin = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user!.userId;
    const pinQuery = req.query.pin as string | undefined;

    logger.info('Validating transfer PIN requirement', { userId });

    const cards = await CardRepository.getUserCards(userId);
    if (!cards || cards.length === 0) {
      logger.info('User has no cards, skipping PIN validation', { userId });
      return next();
    }

    const physicalCards = cards.filter(card => card.cardType === 'PHYSICAL');
    if (physicalCards.length === 0) {
      logger.info('User has no physical cards, skipping PIN validation', {
        userId,
      });
      return next();
    }

    if (!pinQuery) {
      logger.warn('PIN is required for physical card transfers', { userId });
      throw new BadRequestError('PIN requerido');
    }

    const targetCard =
      physicalCards.find(card => card.prosperaCardId) || physicalCards[0];

    if (!targetCard?.prosperaCardId) {
      logger.error('Physical card missing prosperaCardId', {
        userId,
        cardId: targetCard?.id,
      });
      throw new NotFoundError('Card inválida');
    }

    const pinResp = await CardBackofficeService.viewPinForCustomer(
      Number(targetCard.prosperaCardId),
      req.backoffice.customer_oauth_token
    );

    const remotePin = pinResp.payload?.pin;

    logger.info('Validating pin for transfer', {
      userId,
      cardId: targetCard.id,
      remotePinExists: !!remotePin,
    });

    if (!remotePin) {
      logger.error('Pin not found in backoffice response', { pinResp });
      throw new InternalServerError('Unable to retrieve pin for card');
    }

    if (String(remotePin) !== String(pinQuery)) {
      logger.warn('Provided pin does not match remote pin', { userId });
      throw new UnauthorizedError('Invalid PIN');
    }

    return next();
  };
};
