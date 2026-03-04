import { banxicoInstance } from '@/api/banxico.instance';
import binanceInstance from '@/api/binance.instance';
import { buildLogger, exchangeRateUtils } from '@/utils';
import { BadRequestError } from '@/shared/errors';
import {
  BanxicoOportunoResponse,
  BinanceTickerResponse,
  ExchangeRateTodayResponse,
} from '@/schemas';

const logger = buildLogger('exchange-rate-service');

export class ExchangeRateService {
  // Serie Banxico: SF43718 = FIX (Pesos por dólar)
  private static readonly USD_MXN_FIX_SERIES = 'SF43718';
  private static readonly USD_MXN_FEE_RATE = 0.05;
  private static readonly BOB_USDT_BINANCE_SYMBOL = 'BOBUSDT';
  private static readonly USDT_MXN_BINANCE_SYMBOL = 'USDTMXN';
  private static readonly BOB_USDT_FEE_RATE = 0.012;
  private static readonly USDT_MXN_FEE_RATE = 0.033;

  static async getUsdMxnFixToday(): Promise<ExchangeRateTodayResponse> {
    logger.info('Fetching USD/MXN FIX exchange rate (oportuno)');

    const { data } = await banxicoInstance.get<BanxicoOportunoResponse>(
      `/series/${this.USD_MXN_FIX_SERIES}/datos/oportuno`,
      { params: { mediaType: 'json' } }
    );

    const serie = data?.bmx?.series?.[0];
    const item = serie?.datos?.[0];

    const fecha = item?.fecha;
    const datoRaw = item?.dato;

    if (!fecha || !datoRaw) {
      throw new BadRequestError('Banxico response missing date or rate.');
    }

    const rate = Number(datoRaw.replace(',', ''));
    if (!Number.isFinite(rate)) {
      throw new BadRequestError(`Invalid Banxico rate value: ${datoRaw}`);
    }

    const rateWithFee = exchangeRateUtils.applyFee(rate, this.USD_MXN_FEE_RATE);

    return {
      provider: 'BANXICO',
      seriesId: 'SF43718',
      date: fecha,
      rate: rateWithFee,
      title: serie?.titulo,
    };
  }

  static async getBobMxnToday(): Promise<ExchangeRateTodayResponse> {
    logger.info('Fetching BOB/MXN exchange rate from Binance');

    const [{ data: bobUsdt }, { data: usdtMxn }] = await Promise.all([
      binanceInstance.get<BinanceTickerResponse>('/api/v3/ticker/price', {
        params: { symbol: this.BOB_USDT_BINANCE_SYMBOL },
      }),
      binanceInstance.get<BinanceTickerResponse>('/api/v3/ticker/price', {
        params: { symbol: this.USDT_MXN_BINANCE_SYMBOL },
      }),
    ]);

    const bobUsdtPrice = Number(bobUsdt?.price);
    if (!Number.isFinite(bobUsdtPrice) || bobUsdtPrice <= 0) {
      throw new BadRequestError(
        `Invalid Binance price value: ${bobUsdt?.price}`
      );
    }

    const usdtMxnPrice = Number(usdtMxn?.price);
    if (!Number.isFinite(usdtMxnPrice) || usdtMxnPrice <= 0) {
      throw new BadRequestError(
        `Invalid Binance price value: ${usdtMxn?.price}`
      );
    }

    // BOBUSDT = USDT per 1 BOB, USDTMXN = MXN per 1 USDT
    const rate = exchangeRateUtils.buildBobMxnRate(
      bobUsdtPrice,
      usdtMxnPrice,
      this.BOB_USDT_FEE_RATE,
      this.USDT_MXN_FEE_RATE
    );

    return {
      provider: 'BINANCE',
      seriesId: `${this.BOB_USDT_BINANCE_SYMBOL},${this.USDT_MXN_BINANCE_SYMBOL}`,
      date: exchangeRateUtils.formatDate(new Date()),
      rate,
      title: 'Binance BOBUSDT + USDTMXN spot price (fee applied)',
    };
  }
}
