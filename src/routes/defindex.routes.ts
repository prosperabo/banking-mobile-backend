import { Router } from 'express';
import { authenticateToken } from '@/middlewares/authenticateToken';
import { DefindexWalletController } from '@/controllers/defindexWallet.controller';

const router = Router();

router.use(authenticateToken);

router.post('/wallets', DefindexWalletController.createWallet);
router.get('/wallets/me', DefindexWalletController.getMyWallet);

export default router;
