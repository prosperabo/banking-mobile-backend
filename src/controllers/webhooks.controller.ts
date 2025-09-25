import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { validationResult } from 'express-validator';
import {
  WebhooksService,
  BackofficeEventPayload,
} from '@/services/webhooks.service';
import { buildLogger } from '@/shared/utils';

const logger = buildLogger('webhooks-controller');

export class WebhooksController {
  static async handleBackofficeCardEvent(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // Validate payload
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, errors: errors.array() });
        return;
      }

      const signature = String(req.header('x-signature') || '');
      const timestamp = String(req.header('x-timestamp') || '');

      if (!signature || !timestamp) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ success: false, message: 'Missing signature/timestamp' });
        return;
      }

      if (!WebhooksService.isFresh(timestamp)) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ success: false, message: 'Stale timestamp' });
        return;
      }

      const rawBody: Buffer | undefined = (
        req as Request & { rawBody?: Buffer }
      ).rawBody;
      if (!rawBody) {
        res
          .status(StatusCodes.BAD_REQUEST)
          .json({ success: false, message: 'Missing raw body' });
        return;
      }

      const isValid = WebhooksService.verifySignature(
        rawBody,
        signature,
        timestamp
      );
      if (!isValid) {
        res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ success: false, message: 'Invalid signature' });
        return;
      }

      const payload = req.body as BackofficeEventPayload;

      // Idempotency check
      const already = await WebhooksService.alreadyProcessed(payload.event_id);
      if (already) {
        // Short-circuit: already processed; return 200 OK to avoid retries
        res
          .status(StatusCodes.OK)
          .json({ success: true, message: 'Already processed' });
        return;
      }

      await WebhooksService.recordEvent(
        payload.event_id,
        payload.type,
        payload,
        'RECEIVED'
      );

      try {
        await WebhooksService.processEvent(payload);
        await WebhooksService.recordEvent(
          payload.event_id,
          payload.type,
          payload,
          'PROCESSED'
        );
        res.status(StatusCodes.OK).json({ success: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Processing failed', {
          message,
          event_id: payload.event_id,
          type: payload.type,
        });
        await WebhooksService.recordEvent(
          payload.event_id,
          payload.type,
          payload,
          'ERROR',
          message
        );
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ success: false, message });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Webhook handler error', { message });
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message });
    }
  }
}
