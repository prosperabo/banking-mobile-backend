import { Router } from 'express';
import { WebhooksController } from '@/controllers/webhooks.controller';
import { bulkOrderCardNotificationValidator } from '@/validators/webhooks.validator';
import { validateRequest } from '@/middlewares';

const router = Router();

router.post(
  '/bulk-order-card',
  validateRequest(...bulkOrderCardNotificationValidator),
  WebhooksController.handleBulkOrderCardNotification
);

export default router;
