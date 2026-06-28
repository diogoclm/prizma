import { describe, it, expect } from "vitest";
import { calcMetrics, calcMetricsWithResidual, applyOwnership } from "../metrics";
import type { CashFlow } from "../types";

describe("calcMetrics", () => {
  it("calcula MOIC e TIR corretamente para projeto simples", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -1_000_000 },
      { date: new Date("2024-01-01"), amount: 1_500_000 },
    ];
    const m = calcMetrics(flows);
    expect(m.totalInvested).toBe(1_000_000);
    expect(m.totalDistributed).toBe(1_500_000);
    expect(m.moic).toBeCloseTo(1.5, 4);
    expect(m.irr.converged).toBe(true);
    expect(m.irr.irr).toBeCloseTo(0.2247, 3); // ~22.47% a.a.
  });

  it("MOIC = 0 quando não há retornos", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -500_000 },
    ];
    const m = calcMetrics(flows);
    expect(m.moic).toBe(0);
    expect(m.irr.converged).toBe(false);
  });
});

describe("calcMetricsWithResidual — hoteleiro", () => {
  it("separa DPI de RVPI corretamente", () => {
    const operatingFlows: CashFlow[] = [
      { date: new Date("2020-01-01"), amount: -1_000_000 }, // aporte
      { date: new Date("2021-01-01"), amount: 100_000 },    // distribuição
      { date: new Date("2022-01-01"), amount: 150_000 },    // distribuição
    ];
    const residualValue = 900_000; // valor de mercado da participação hoje
    const residualDate = new Date("2023-06-01");

    const m = calcMetricsWithResidual(operatingFlows, residualValue, residualDate);

    expect(m.totalInvested).toBe(1_000_000);
    expect(m.totalDistributed).toBe(250_000);
    expect(m.residualValue).toBe(900_000);
    expect(m.dpi).toBeCloseTo(0.25, 4);   // 250k / 1M
    expect(m.rvpi).toBeCloseTo(0.90, 4);  // 900k / 1M
    expect(m.tvpi).toBeCloseTo(1.15, 4);  // DPI + RVPI
    expect(m.irr.converged).toBe(true);
  });
});

describe("applyOwnership", () => {
  it("multiplica todos os fluxos pela fração de participação", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -2_000_000 },
      { date: new Date("2023-01-01"), amount: 500_000 },
    ];
    const prizma50 = applyOwnership(flows, 50);
    expect(prizma50[0].amount).toBe(-1_000_000);
    expect(prizma50[1].amount).toBe(250_000);
  });

  it("100% de ownership não altera os fluxos", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -500_000 },
      { date: new Date("2024-01-01"), amount: 750_000 },
    ];
    const full = applyOwnership(flows, 100);
    expect(full[0].amount).toBe(-500_000);
    expect(full[1].amount).toBe(750_000);
  });

  it("não muta o array original", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -1_000_000 },
    ];
    applyOwnership(flows, 50);
    expect(flows[0].amount).toBe(-1_000_000); // original intacto
  });
});
