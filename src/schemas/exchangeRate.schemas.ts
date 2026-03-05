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

export type BinanceTickerResponse = {
  symbol: string;
  price: string;
};

export type CriptoyaQuoteResponse = {
  ask: number;
  bid: number;
  totalAsk?: number;
  totalBid?: number;
  time?: number;
};

export type ExchangeRateTodayResponse = {
  provider: 'BANXICO' | 'BINANCE' | 'CRIPTOYA';
  seriesId: string;
  date: string; // dd/MM/yyyy
  rate: number; // target por 1 base (segun par)
  title?: string;
};
