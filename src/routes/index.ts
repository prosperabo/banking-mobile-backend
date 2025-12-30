import { Router } from 'express';

import authRouter from './auth.routes';
import webhookRouter from './webhook.routes';
import cardRouter from './card.routes';
import userRouter from './user.routes';
import transactionsRouter from './transactions.routes';
import inspirationRouter from './inspiration.routes';
import paymentRouter from './payment.routes';

const router = Router();

router.get('/', (_req, res) => res.send({ message: 'API is up!' }));
router.use('/auth', authRouter);
router.use('/webhooks', webhookRouter);
router.use('/card', cardRouter);
router.use('/user', userRouter);
router.use('/transactions', transactionsRouter);
router.use('/inspiration', inspirationRouter);
router.use('/payment', paymentRouter);

router.get('/myip', async (req, res) => {
  const r = await fetch('https://ifconfig.me', {
    headers: { 'User-Agent': 'curl' },
  });
  res.send(await r.text());
});

export default router;
