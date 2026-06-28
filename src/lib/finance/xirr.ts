import type { CashFlow, XirrResult } from "./types";
import { xnpv } from "./xnpv";

const MAX_ITERATIONS = 1000;
const TOLERANCE = 1e-7;

/**
 * XIRR — Taxa Interna de Retorno com datas irregulares.
 * Equivalente ao XTIR do Excel. Usa método de Newton-Raphson com fallback bisseção.
 *
 * Premissas:
 * - Deve haver ao menos um fluxo negativo e um positivo para ter solução real.
 * - A taxa retornada é anual (base 365 dias).
 * - Caso não converja, retorna { irr: NaN, converged: false }.
 */
export function xirr(cashFlows: CashFlow[], guess = 0.1): XirrResult {
  if (cashFlows.length < 2) return { irr: NaN, converged: false };

  const hasNeg = cashFlows.some((cf) => cf.amount < 0);
  const hasPos = cashFlows.some((cf) => cf.amount > 0);
  if (!hasNeg || !hasPos) return { irr: NaN, converged: false };

  const sorted = [...cashFlows].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Newton-Raphson
  let rate = guess;
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const npv = xnpv(rate, sorted);
    const derivative = _xnpvDerivative(rate, sorted);

    if (Math.abs(derivative) < 1e-12) break;

    const newRate = rate - npv / derivative;

    if (Math.abs(newRate - rate) < TOLERANCE) {
      return { irr: newRate, converged: true };
    }

    // Evitar taxas impossíveis (abaixo de -100%)
    rate = newRate < -0.9999 ? -0.9999 : newRate;
  }

  // Fallback: bisseção entre -99% e 1000%
  return _bisection(sorted);
}

function _xnpvDerivative(rate: number, cashFlows: CashFlow[]): number {
  const DAYS_PER_YEAR = 365;
  const t0 = cashFlows[0].date.getTime();

  return cashFlows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - t0) / (1000 * 60 * 60 * 24 * DAYS_PER_YEAR);
    return sum + (-years * cf.amount) / Math.pow(1 + rate, years + 1);
  }, 0);
}

function _bisection(cashFlows: CashFlow[]): XirrResult {
  let lo = -0.9999;
  let hi = 10.0; // 1000% a.a.

  if (xnpv(lo, cashFlows) * xnpv(hi, cashFlows) > 0) {
    return { irr: NaN, converged: false };
  }

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const mid = (lo + hi) / 2;
    const npvMid = xnpv(mid, cashFlows);

    if (Math.abs(npvMid) < TOLERANCE || (hi - lo) / 2 < TOLERANCE) {
      return { irr: mid, converged: true };
    }

    if (npvMid * xnpv(lo, cashFlows) < 0) {
      hi = mid;
    } else {
      lo = mid;
    }
  }

  return { irr: (lo + hi) / 2, converged: false };
}
