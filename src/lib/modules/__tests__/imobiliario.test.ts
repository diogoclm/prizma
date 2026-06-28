import { describe, it, expect } from "vitest";
import { xirr } from "@/lib/finance/xirr";
import type { CashFlow } from "@/lib/finance/types";

/**
 * Testa a lógica central do módulo imobiliário de forma pura,
 * sem banco. Valida os três cenários: entregue, em construção, landbanking.
 */

function calcSpeIrrPure(
  realizedFlows: CashFlow[],
  projectedFutureFlows: CashFlow[],
  ownershipPct: number
) {
  const f = ownershipPct / 100;
  const rFlows = realizedFlows.map((cf) => ({ ...cf, amount: cf.amount * f }));
  const pFlows = projectedFutureFlows.map((cf) => ({ ...cf, amount: cf.amount * f }));

  const realizedIrr = rFlows.length >= 2 ? xirr(rFlows) : { irr: NaN, converged: false };
  const combined = [...rFlows, ...pFlows];
  const currentIrr = combined.length >= 2 ? xirr(combined) : { irr: NaN, converged: false };

  return { realizedIrr, currentIrr };
}

describe("módulo imobiliário — SPE entregue (ciclo completo)", () => {
  it("calcula TIR realizada correta para obra entregue", () => {
    const realizedFlows: CashFlow[] = [
      { date: new Date("2021-01-01"), amount: -2_000_000 },
      { date: new Date("2022-01-01"), amount: -1_000_000 },
      { date: new Date("2024-06-01"), amount: 5_500_000 },
    ];
    const { realizedIrr } = calcSpeIrrPure(realizedFlows, [], 100);
    expect(realizedIrr.converged).toBe(true);
    // MOIC 5.5M/3M = 1.83x em 3.5 anos → ~21-22% a.a.
    expect(realizedIrr.irr).toBeGreaterThan(0.18);
  });

  it("TIR com 50% de ownership é igual à TIR com 100% (a fração cancela)", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -1_000_000 },
      { date: new Date("2024-01-01"), amount: 1_440_000 },
    ];
    const { realizedIrr: irr100 } = calcSpeIrrPure(flows, [], 100);
    const { realizedIrr: irr50 } = calcSpeIrrPure(flows, [], 50);
    // TIR é taxa, não valor — deve ser a mesma independente da escala
    expect(irr100.irr).toBeCloseTo(irr50.irr, 6);
  });
});

describe("módulo imobiliário — SPE em construção (realizado + reprojeção)", () => {
  it("TIR corrente inclui fluxos projetados futuros", () => {
    const realized: CashFlow[] = [
      { date: new Date("2023-01-01"), amount: -2_000_000 },
      { date: new Date("2023-07-01"), amount: -1_000_000 },
    ];
    const projected: CashFlow[] = [
      { date: new Date("2026-01-01"), amount: 2_500_000 },
      { date: new Date("2026-06-01"), amount: 2_000_000 },
    ];
    const { realizedIrr, currentIrr } = calcSpeIrrPure(realized, projected, 100);
    // Sem retorno ainda → realizada não converge
    expect(realizedIrr.converged).toBe(false);
    // Com projeção → deve convergir e ser positiva
    expect(currentIrr.converged).toBe(true);
    expect(currentIrr.irr).toBeGreaterThan(0);
  });
});

describe("módulo imobiliário — landbanking (só baseline)", () => {
  it("sem fluxos realizados → TIR realizada não converge", () => {
    const { realizedIrr, currentIrr } = calcSpeIrrPure([], [], 100);
    expect(realizedIrr.converged).toBe(false);
    expect(currentIrr.converged).toBe(false);
  });
});

describe("variância projetado × realizado", () => {
  it("obra que superou o baseline tem variância positiva", () => {
    const baselineIrr = 0.20; // 20% projetado
    const currentIrr = 0.25;  // 25% realizado
    const variancePp = (currentIrr - baselineIrr) * 100;
    expect(variancePp).toBeCloseTo(5, 4); // +5 p.p.
  });

  it("obra abaixo do baseline tem variância negativa", () => {
    const baselineIrr = 0.25;
    const currentIrr = 0.18;
    const variancePp = (currentIrr - baselineIrr) * 100;
    expect(variancePp).toBeCloseTo(-7, 4); // -7 p.p.
  });
});
