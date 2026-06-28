import { describe, it, expect } from "vitest";
import { _calcBaselineMetricsForTest } from "../service.testhelper";

/**
 * Testamos a lógica de cálculo do baseline de forma pura (sem banco).
 * O service.ts usa prisma, então extraímos a função de cálculo para um helper
 * de teste para não depender de DB em testes unitários.
 */
describe("baseline — cálculo de métricas projetadas", () => {
  it("calcula TIR e MOIC corretos para fluxo imobiliário típico", () => {
    const flows = [
      { date: "2022-01-01", amount: -2_000_000 },
      { date: "2023-01-01", amount: -1_000_000 },
      { date: "2025-01-01", amount: 5_000_000 },
    ];
    const { projectedIrr, projectedMoic } = _calcBaselineMetricsForTest(flows);

    expect(projectedIrr).not.toBeNull();
    expect(projectedIrr!).toBeGreaterThan(0.2); // > 20% a.a.
    expect(projectedMoic).toBeCloseTo(5 / 3, 4); // 5M retorno / 3M aportado
  });

  it("retorna null para menos de 2 fluxos (sem solução)", () => {
    const { projectedIrr, projectedMoic } = _calcBaselineMetricsForTest([
      { date: "2024-01-01", amount: -500_000 },
    ]);
    expect(projectedIrr).toBeNull();
    expect(projectedMoic).toBeNull();
  });

  it("retorna null quando não há fluxo positivo", () => {
    const { projectedIrr } = _calcBaselineMetricsForTest([
      { date: "2024-01-01", amount: -500_000 },
      { date: "2025-01-01", amount: -300_000 },
    ]);
    expect(projectedIrr).toBeNull();
  });

  it("recalcular com os mesmos inputs produz o mesmo resultado (idempotência)", () => {
    const flows = [
      { date: "2023-01-01", amount: -1_000_000 },
      { date: "2025-06-01", amount: 1_600_000 },
    ];
    const r1 = _calcBaselineMetricsForTest(flows);
    const r2 = _calcBaselineMetricsForTest(flows);
    expect(r1.projectedIrr).toBe(r2.projectedIrr);
    expect(r1.projectedMoic).toBe(r2.projectedMoic);
  });
});
