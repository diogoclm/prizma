import { describe, it, expect } from "vitest";
import { calcMetricsWithResidual, applyOwnership } from "@/lib/finance/metrics";
import type { CashFlow } from "@/lib/finance/types";

/**
 * Testa a lógica do módulo hoteleiro de forma pura (sem banco).
 * Foca em: ownership 50%, terminal value via valuation, DPI/RVPI/TVPI.
 */

describe("módulo hoteleiro — ownership 50%", () => {
  const fullProjectFlows: CashFlow[] = [
    { date: new Date("2020-01-01"), amount: -2_000_000 }, // aporte total do projeto
    { date: new Date("2021-01-01"), amount: 200_000 },    // distribuição total
    { date: new Date("2022-01-01"), amount: 300_000 },    // distribuição total
  ];

  it("aplica ownership 50% corretamente nos fluxos", () => {
    const prizma = applyOwnership(fullProjectFlows, 50);
    expect(prizma[0].amount).toBe(-1_000_000);
    expect(prizma[1].amount).toBe(100_000);
    expect(prizma[2].amount).toBe(150_000);
  });

  it("calcula DPI, RVPI e TVPI corretamente com valuation", () => {
    const prizmaFlows = applyOwnership(fullProjectFlows, 50);
    const residualValue = 1_200_000; // 50% de R$ 2.4M de valuation
    const residualDate = new Date("2024-01-01");

    const m = calcMetricsWithResidual(prizmaFlows, residualValue, residualDate);

    expect(m.totalInvested).toBe(1_000_000);
    expect(m.totalDistributed).toBe(250_000); // 100k + 150k
    expect(m.dpi).toBeCloseTo(0.25, 4);       // 250k / 1M
    expect(m.rvpi).toBeCloseTo(1.20, 4);      // 1.2M / 1M
    expect(m.tvpi).toBeCloseTo(1.45, 4);      // DPI + RVPI
    expect(m.irr.converged).toBe(true);
  });

  it("aumentar valuation (marcação acima do investido) aumenta a TIR", () => {
    const prizmaFlows = applyOwnership(fullProjectFlows, 50);
    const date = new Date("2024-01-01");

    const m1 = calcMetricsWithResidual(prizmaFlows, 800_000, date);
    const m2 = calcMetricsWithResidual(prizmaFlows, 1_500_000, date);

    expect(m2.irr.irr).toBeGreaterThan(m1.irr.irr!);
  });

  it("mudar a data da valuation (mais longe) reduz a TIR anualizada", () => {
    const prizmaFlows = applyOwnership(fullProjectFlows, 50);
    const residual = 1_200_000;

    const mNear = calcMetricsWithResidual(prizmaFlows, residual, new Date("2023-01-01"));
    const mFar = calcMetricsWithResidual(prizmaFlows, residual, new Date("2026-01-01"));

    // Mais longe no tempo → TIR anualizada menor (mesmo valor terminal)
    expect(mFar.irr.irr!).toBeLessThan(mNear.irr.irr!);
  });
});
