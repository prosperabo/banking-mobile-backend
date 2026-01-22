export type BanxicoOportunoResponse = {
  bmx?: {
    series?: Array<{
      idSerie?: string;
      titulo?: string;
      datos?: Array<{
        fecha?: string; // formato: dd/MM/yyyy
        dato?: string; // viene como string
      }>;
    }>;
  };
};

export type ExchangeRateTodayResponse = {
  provider: 'BANXICO';
  seriesId: 'SF43718';
  date: string; // dd/MM/yyyy (como Banxico)
  rate: number; // MXN por 1 USD
  title?: string;
};
