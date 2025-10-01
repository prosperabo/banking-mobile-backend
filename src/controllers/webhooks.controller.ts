import { Request, Response } from 'express';

import { catchErrors, successHandler } from '@/shared/handlers';
import { BulkOrderCardNotification } from '@/schemas';
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
}
