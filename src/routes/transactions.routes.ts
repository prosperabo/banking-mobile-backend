import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { TransactionsController } from '@/controllers/transactions.controller';
import { validateRequest } from '@/middlewares';
import { getTransactionsValidator } from '@/validators/transactions.validator';

const router = Router();

router.use(authenticateToken);

// Route to get user transactions
router.get(
  '/',
  validateRequest(...getTransactionsValidator),
  TransactionsController.getUserTransactions
);

export default router;
