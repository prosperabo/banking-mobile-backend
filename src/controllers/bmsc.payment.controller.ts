import { Request, Response } from 'express';
import { BmscPaymentService } from '@/services/bmsc.payment.service';
import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { CreateSipQrRequestDto, SipCallbackDto } from '@/schemas/sip.schemas';

const logger = buildLogger('BmscPaymentController');

export class BmscPaymentController {
  /**
   * POST /bmsc/payments/sip/qr
   * Authenticated – generate a SIP QR for the requesting user.
   */
  static createSipQr = catchErrors(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const sipQrRequest = req.body as CreateSipQrRequestDto;

    logger.info('Creating SIP QR', { userId });

    const sipQrResult = await BmscPaymentService.createSipQr(
      userId,
      sipQrRequest
    );

    return successHandler(res, sipQrResult, 'QR generated successfully');
  });

  /**
   * POST /bmsc/payments/sip/callback
   * Called by SIP to confirm a payment. Authenticated via Basic Auth middleware.
   */
  static sipCallback = catchErrors(async (req: Request, res: Response) => {
    const sipCallbackPayload = req.body as SipCallbackDto;

    logger.info('Processing SIP callback', {
      alias: sipCallbackPayload.alias,
    });

    const ack = await BmscPaymentService.handleSipCallback(sipCallbackPayload);

    // Respond with SIP-expected JSON directly (not wrapped in successHandler)
    res.status(200).json(ack);
  });
}
