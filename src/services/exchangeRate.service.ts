import { banxicoInstance } from '@/api/banxico.instance';
import binanceInstance from '@/api/binance.instance';
import { buildLogger } from '@/utils';
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

  private static formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  }

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

    const rateWithFee = rate * (1 + this.USD_MXN_FEE_RATE);

    return {
      provider: 'BANXICO',
      seriesId: 'SF43718',
      date: fecha,
      rate: rateWithFee,
      title: serie?.titulo,
    };
  }

  static async getBobUsdtToday(): Promise<ExchangeRateTodayResponse> {
    logger.info('Fetching BOB/USDT exchange rate from Binance');

    const { data } = await binanceInstance.get<BinanceTickerResponse>(
      '/api/v3/ticker/price',
      { params: { symbol: this.BOB_USDT_BINANCE_SYMBOL } }
    );

    const price = Number(data?.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new BadRequestError(`Invalid Binance price value: ${data?.price}`);
    }

    // BOBUSDT = price in USDT per 1 BOB.
    const rate = price;

    return {
      provider: 'BINANCE',
      seriesId: this.BOB_USDT_BINANCE_SYMBOL,
      date: this.formatDate(new Date()),
      rate,
      title: 'Binance BOBUSDT spot price',
    };
  }
}
