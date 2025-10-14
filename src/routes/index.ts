import { Router } from 'express';

import authRouter from './auth.routes';
import webhookRouter from './webhook.routes';
import cardRouter from './card.routes';
import userRouter from './user.routes';

const router = Router();

router.get('/', (_req, res) => res.send({ message: 'API is up!' }));
router.use('/auth', authRouter);
router.use('/webhooks', webhookRouter);
router.use('/card', cardRouter);
router.use('/user', userRouter);

export default router;
