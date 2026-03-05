import { banxicoInstance } from '@/api/banxico.instance';
import criptoyaInstance from '@/api/criptoya.instance';
import { buildLogger, exchangeRateUtils } from '@/utils';
import { BadRequestError } from '@/shared/errors';
import {
  BanxicoOportunoResponse,
  CriptoyaQuoteResponse,
  ExchangeRateTodayResponse,
} from '@/schemas';

const logger = buildLogger('exchange-rate-service');

export class ExchangeRateService {
  // Serie Banxico: SF43718 = FIX (Pesos por dólar)
  private static readonly USD_MXN_FIX_SERIES = 'SF43718';
  private static readonly USD_MXN_FEE_RATE = 0.05;
  private static readonly CRIPTOYA_EXCHANGE = 'binancep2p';
  private static readonly CRIPTOYA_COIN = 'USDT';
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
    logger.info('Fetching BOB/MXN exchange rate from CriptoYa');

    const volume = 100;
    const bobPath = `/api/${this.CRIPTOYA_EXCHANGE}/${this.CRIPTOYA_COIN}/BOB/${volume}`;
    const mxnPath = `/api/${this.CRIPTOYA_EXCHANGE}/${this.CRIPTOYA_COIN}/MXN/${volume}`;

    const [{ data: bobQuote }, { data: mxnQuote }] = await Promise.all([
      criptoyaInstance.get<CriptoyaQuoteResponse>(bobPath),
      criptoyaInstance.get<CriptoyaQuoteResponse>(mxnPath),
    ]);

    const bobAsk = Number(bobQuote?.ask);
    if (!Number.isFinite(bobAsk) || bobAsk <= 0) {
      throw new BadRequestError(`Invalid CriptoYa ask value: ${bobQuote?.ask}`);
    }

    const mxnBid = Number(mxnQuote?.bid);
    if (!Number.isFinite(mxnBid) || mxnBid <= 0) {
      throw new BadRequestError(`Invalid CriptoYa bid value: ${mxnQuote?.bid}`);
    }

    // BOB -> USDT uses ask (fiat to buy crypto), USDT -> MXN uses bid (sell crypto)
    const rate = exchangeRateUtils.buildBobMxnRate(
      bobAsk,
      mxnBid,
      this.BOB_USDT_FEE_RATE,
      this.USDT_MXN_FEE_RATE
    );

    return {
      provider: 'CRIPTOYA',
      seriesId: `${this.CRIPTOYA_EXCHANGE}:${this.CRIPTOYA_COIN}/BOB,${this.CRIPTOYA_EXCHANGE}:${this.CRIPTOYA_COIN}/MXN`,
      date: exchangeRateUtils.formatDate(new Date()),
      rate,
      title: 'CriptoYa BOB/USDT (ask) + USDT/MXN (bid) (fee applied)',
    };
  }
}
