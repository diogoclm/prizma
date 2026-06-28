import type { CashFlow, ProjectMetrics } from "./types";
import { xirr } from "./xirr";

/**
 * Calcula as métricas completas de um projeto dado o fluxo de caixa.
 *
 * Para o hoteleiro contínuo: incluir um VALOR_TERMINAL como último fluxo positivo
 * representando a marcação a mercado atual da participação.
 *
 * Para projetos com participação parcial (ex: 50%): aplique ownershipPct ANTES
 * de chamar esta função (multiplique todos os amounts pela fração).
 */
export function calcMetrics(cashFlows: CashFlow[]): ProjectMetrics {
  const totalInvested = cashFlows
    .filter((cf) => cf.amount < 0)
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalDistributed = cashFlows
    .filter((cf) => cf.amount > 0)
    .reduce((sum, cf) => sum + cf.amount, 0);

  // O residualValue é o último fluxo positivo marcado como terminal value,
  // mas para simplicidade aqui assumimos que o chamador já inclui o terminal
  // como fluxo positivo. RVPI = valor residual / capital investido.
  // Neste ponto não distinguimos distribuições de residual — o caller deve
  // separar se precisar de DPI/RVPI distintos.
  const dpi = totalInvested > 0 ? totalDistributed / totalInvested : 0;
  const tvpi = dpi; // sem valor residual separado
  const rvpi = 0;

  return {
    irr: xirr(cashFlows),
    moic: totalInvested > 0 ? totalDistributed / totalInvested : 0,
    tvpi,
    dpi,
    rvpi,
    totalInvested,
    totalDistributed,
    residualValue: 0,
  };
}

/**
 * Calcula métricas distinguindo fluxos de distribuição de valor terminal (residual).
 * Use quando o último fluxo positivo representa marcação a mercado, não distribuição efetiva.
 */
export function calcMetricsWithResidual(
  operatingFlows: CashFlow[],
  residualValue: number,
  residualDate: Date
): ProjectMetrics {
  const terminal: CashFlow = { date: residualDate, amount: residualValue };
  const allFlows = [...operatingFlows, terminal];

  const totalInvested = operatingFlows
    .filter((cf) => cf.amount < 0)
    .reduce((sum, cf) => sum + Math.abs(cf.amount), 0);

  const totalDistributed = operatingFlows
    .filter((cf) => cf.amount > 0)
    .reduce((sum, cf) => sum + cf.amount, 0);

  const dpi = totalInvested > 0 ? totalDistributed / totalInvested : 0;
  const rvpi = totalInvested > 0 ? residualValue / totalInvested : 0;
  const tvpi = dpi + rvpi;

  return {
    irr: xirr(allFlows),
    moic: tvpi,
    tvpi,
    dpi,
    rvpi,
    totalInvested,
    totalDistributed,
    residualValue,
  };
}

/**
 * Aplica a fração de propriedade sobre os fluxos do projeto.
 * Use para o hoteleiro onde a Prizma possui 50%.
 */
export function applyOwnership(cashFlows: CashFlow[], ownershipPct: number): CashFlow[] {
  const fraction = ownershipPct / 100;
  return cashFlows.map((cf) => ({ ...cf, amount: cf.amount * fraction }));
}
