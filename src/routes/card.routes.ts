import { Router } from 'express';

import { authenticateToken } from '@/middlewares/authenticateToken';
import { CardController } from '@/controllers/card.controller';
import {
  activateCardValidator,
  stopCardValidator,
  unstopCardValidator,
  cardIdParamValidator,
  cardPinQueryValidator,
} from '@/validators/card.validator';
import {
  validateRequest,
  validateCardPin,
  validateCardOwnership,
} from '@/middlewares';

const router = Router();

router.use(authenticateToken);

// Route to get all cards
router.get('/', CardController.getUserCards);

// Route to activate a card
router.post(
  '/:cardId/activate',
  validateRequest(...cardIdParamValidator, ...activateCardValidator),
  validateCardOwnership(),
  CardController.activateCard
);

// Route to get card details by ID
router.get(
  '/:cardId/details',
  validateRequest(...cardIdParamValidator, ...cardPinQueryValidator),
  validateCardOwnership(),
  validateCardPin(),
  CardController.getCardDetailsById
);

// Route to stop (block) a card
router.post(
  '/:cardId/stop',
  validateRequest(
    ...cardIdParamValidator,
    ...cardPinQueryValidator,
    ...stopCardValidator
  ),
  validateCardOwnership(),
  validateCardPin(),
  CardController.stopCard
);

// Route to unstop (unblock) a card
router.post(
  '/:cardId/unstop',
  validateRequest(
    ...cardIdParamValidator,
    ...cardPinQueryValidator,
    ...unstopCardValidator
  ),
  validateCardOwnership(),
  validateCardPin(),
  CardController.unstopCard
);

export default router;
