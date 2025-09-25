import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { loginValidator } from '@/validators/auth.validator';
import { WebhooksController } from '@/controllers/webhooks.controller';
import { cardEventValidator } from '@/validators/webhooks.validator';

const router = Router();
router.get('/', (_req, res) => res.send({ message: 'API is up!' }));
router.post('/auth/login', loginValidator, AuthController.login);
router.post(
  '/webhooks/backoffice/card-events',
  cardEventValidator,
  WebhooksController.handleBackofficeCardEvent
);

export default router;
