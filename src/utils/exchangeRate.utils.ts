export const exchangeRateUtils = {
  formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = String(date.getFullYear());
    return `${dd}/${mm}/${yyyy}`;
  },

  applyFee(rate: number, feeRate: number): number {
    return rate * (1 + feeRate);
  },

  buildBobMxnRate(
    bobUsdt: number,
    usdtMxn: number,
    bobUsdtFee: number,
    usdtMxnFee: number
  ): number {
    const bobUsdtWithFee = this.applyFee(bobUsdt, bobUsdtFee);
    const usdtMxnWithFee = this.applyFee(usdtMxn, usdtMxnFee);
    return bobUsdtWithFee * usdtMxnWithFee;
  },
};
