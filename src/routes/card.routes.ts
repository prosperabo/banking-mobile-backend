import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';

const router = Router();

router.use(authenticateToken);
// Route to get all cards
router.get('/', (req, res) => {
  // Logic to fetch and return all cards for the authenticated user
  res.json({ message: 'Fetch all cards' });
});

// Route to activate a card
router.post('/:cardId/activate', (req, res) => {
  const { cardId } = req.params;
  // Logic to activate the card with the given cardId
  res.json({ message: `Card ${cardId} activated` });
});

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

export default router;
