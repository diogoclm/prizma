/**
 * Helper de teste: expõe a lógica de cálculo de métricas do baseline sem depender do Prisma.
 * Importado apenas em testes.
 */
import { xirr } from "@/lib/finance/xirr";
import type { CashFlow } from "@/lib/finance/types";

export function _calcBaselineMetricsForTest(flows: { date: string; amount: number }[]) {
  if (flows.length < 2) return { projectedIrr: null, projectedMoic: null };

  const cashFlows: CashFlow[] = flows.map((f) => ({
    date: new Date(f.date),
    amount: f.amount,
  }));

  const totalInvested = cashFlows
    .filter((cf) => cf.amount < 0)
    .reduce((s, cf) => s + Math.abs(cf.amount), 0);
  const totalReturn = cashFlows
    .filter((cf) => cf.amount > 0)
    .reduce((s, cf) => s + cf.amount, 0);

  const { irr, converged } = xirr(cashFlows);

  return {
    projectedIrr: converged ? irr : null,
    projectedMoic: totalInvested > 0 ? totalReturn / totalInvested : null,
  };
}
