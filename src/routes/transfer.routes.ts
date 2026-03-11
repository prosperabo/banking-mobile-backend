import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { TransferController } from '@/controllers/transfer.controller';
import { validateRequest, validateTransferCardPin } from '@/middlewares';
import {
  speiCashoutValidator,
  transferTypeQueryValidator,
  transferValidator,
} from '@/validators/transfer.validator';

const router = Router();

router.use(authenticateToken);

// Route to transfer (by email or alias based on queryType param, defaults to email)
router.post(
  '/',
  validateRequest(...transferValidator, ...transferTypeQueryValidator),
  validateTransferCardPin(),
  TransferController.transfer
);

// Route to withdraw funds to a CLABE via SPEI
router.post(
  '/spei-cashout',
  validateRequest(...speiCashoutValidator),
  validateTransferCardPin(),
  TransferController.speiCashout
);

// Route to get user QR code
router.get('/qr', TransferController.getUserQR);
router.get('/account/me', TransferController.getMyAccountInfo);

export default router;
