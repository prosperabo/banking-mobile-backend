import { banxicoInstance } from '@/api/banxico.instance';
import { buildLogger } from '@/utils';
import { BadRequestError } from '@/shared/errors';
import { BanxicoOportunoResponse, ExchangeRateTodayResponse } from '@/schemas';

const logger = buildLogger('exchange-rate-service');

export class ExchangeRateService {
  // Serie Banxico: SF43718 = FIX (Pesos por dólar)
  private static readonly USD_MXN_FIX_SERIES = 'SF43718';

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

    return {
      provider: 'BANXICO',
      seriesId: 'SF43718',
      date: fecha,
      rate,
      title: serie?.titulo,
    };
  }
}
