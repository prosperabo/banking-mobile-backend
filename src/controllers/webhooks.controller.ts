import { Request, Response } from 'express';

import { catchErrors, successHandler } from '@/shared/handlers';
import { BulkOrderCardNotification } from '@/schemas';
import { ClipWebhookPayload } from '@/schemas/payment.schemas';
import { WebhooksService } from '@/services/webhooks.service';

export class WebhooksController {
  static handleBulkOrderCardNotification = catchErrors(
    async (req: Request, res: Response) => {
      const data: BulkOrderCardNotification = req.body;

      await WebhooksService.handleBulkOrderCardNotification(data);

      successHandler(
        res,
        data,
        'Bulk order card notification processed successfully'
      );
    }
  );

  static handleClipPaymentWebhook = catchErrors(
    async (req: Request, res: Response) => {
      const data: ClipWebhookPayload = req.body;

      const result = await WebhooksService.handleClipPaymentWebhook(data);

      successHandler(
        res,
        result,
        'Clip payment webhook processed successfully'
      );
    }
  );
}
