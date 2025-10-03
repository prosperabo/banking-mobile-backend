import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { CardController } from '@/controllers/card.controller';
import {
  activateCardValidator,
  cardIdParamValidator,
} from '@/validators/card.validator';
import { validateRequest } from '@/middlewares';

const router = Router();

router.use(authenticateToken);

// Route to get all cards
router.get('/', CardController.getUserCards);

// Route to activate a card
router.post(
  '/:cardId/activate',
  validateRequest(...cardIdParamValidator, ...activateCardValidator),
  CardController.activateCard
);

router.get(
  '/:cardId/details',
  validateRequest(...cardIdParamValidator),
  CardController.getCardDetailsById
);

// Route to block a card
router.post('/:cardId/block', (req, res) => {
  const { cardId } = req.params;
  // Logic to block the card with the given cardId
  res.json({ message: `Card ${cardId} blocked` });
});

// Route to unblock a card
router.post('/:cardId/unblock', (req, res) => {
  const { cardId } = req.params;
  // Logic to unblock the card with the given cardId
  res.json({ message: `Card ${cardId} unblocked` });
});

// Route to get card details by ID

export default router;
