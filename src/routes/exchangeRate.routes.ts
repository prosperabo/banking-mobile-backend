import { Router } from 'express';
import { ExchangeRateController } from '@/controllers/exchangeRate.controller';

const exchangeRateRouter = Router();

// GET /exchange-rate/usd-mxn/today
exchangeRateRouter.get('/usd-mxn/today', ExchangeRateController.getUsdMxnToday);
// GET /exchange-rate/bob-usdt/today
exchangeRateRouter.get(
  '/bob-usdt/today',
  ExchangeRateController.getBobUsdtToday
);

export default exchangeRateRouter;
