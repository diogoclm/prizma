import type { CashFlow } from "./types";

const DAYS_PER_YEAR = 365;

/**
 * XNPV — Valor Presente Líquido com datas irregulares.
 * Equivalente ao XVPL do Excel.
 * A data base é o primeiro fluxo da lista.
 */
export function xnpv(rate: number, cashFlows: CashFlow[]): number {
  if (cashFlows.length === 0) return 0;

  const t0 = cashFlows[0].date.getTime();

  return cashFlows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24 * DAYS_PER_YEAR);
    return sum + cf.amount / Math.pow(1 + rate, years);
  }, 0);
}
