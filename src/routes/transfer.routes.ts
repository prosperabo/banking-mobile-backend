import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { TransferController } from '@/controllers/transfer.controller';
import { validateRequest } from '@/middlewares';
import {
  transferTypeQueryValidator,
  transferValidator,
} from '@/validators/transfer.validator';

const router = Router();

router.use(authenticateToken);

// Route to transfer (by email or alias based on queryType param, defaults to email)
router.post(
  '/',
  validateRequest(...transferValidator, ...transferTypeQueryValidator),
  TransferController.transfer
);

// Route to get user QR code
router.get('/qr', TransferController.getUserQR);
router.get('/account/me', TransferController.getMyAccountInfo);

export default router;
