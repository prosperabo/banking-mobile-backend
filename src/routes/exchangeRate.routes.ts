import { Router } from 'express';
import { ExchangeRateController } from '@/controllers/exchangeRate.controller';

const exchangeRateRouter = Router();

// GET /exchange-rate/usd-mxn/today
exchangeRateRouter.get('/usd-mxn/today', ExchangeRateController.getUsdMxnToday);
// GET /exchange-rate/bob-mxn/today
exchangeRateRouter.get('/bob-mxn/today', ExchangeRateController.getBobMxnToday);

export default exchangeRateRouter;
