import { Request, Response } from 'express';

import { catchErrors, successHandler } from '@/shared/handlers';
import { buildLogger } from '@/utils';
import { ExchangeRateService } from '@/services/exchangeRate.service';

const logger = buildLogger('exchange-rate-controller');

export class ExchangeRateController {
  static getUsdMxnToday = catchErrors(async (_req: Request, res: Response) => {
    logger.info('GET /exchange-rate/usd-mxn/today');

    const result = await ExchangeRateService.getUsdMxnFixToday();
    successHandler(res, result, 'Exchange rate retrieved successfully');
  });
}
