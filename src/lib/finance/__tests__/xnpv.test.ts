import { describe, it, expect } from "vitest";
import { xnpv } from "../xnpv";
import type { CashFlow } from "../types";

// Tolerância de 1 centavo por R$ 1.000.000 investido
const TOLERANCE = 1e-4;

describe("xnpv", () => {
  it("replica o XVPL do Excel — caso base da documentação Microsoft", () => {
    // Exemplo da documentação do Excel para XNPV
    // Taxa 9%, datas e valores retirados do exemplo oficial
    const flows: CashFlow[] = [
      { date: new Date("2008-01-01"), amount: -10000 },
      { date: new Date("2008-03-01"), amount: 2750 },
      { date: new Date("2008-10-30"), amount: 4250 },
      { date: new Date("2009-02-15"), amount: 3250 },
      { date: new Date("2009-04-01"), amount: 2750 },
    ];
    // Excel retorna 2086.6476 com taxa 9%
    const result = xnpv(0.09, flows);
    expect(result).toBeCloseTo(2086.6476, 2);
  });

  it("retorna o próprio valor com taxa zero", () => {
    const flows: CashFlow[] = [
      { date: new Date("2024-01-01"), amount: -1000 },
      { date: new Date("2025-01-01"), amount: 1200 },
    ];
    expect(xnpv(0, flows)).toBeCloseTo(200, TOLERANCE);
  });

  it("retorna 0 para lista vazia", () => {
    expect(xnpv(0.1, [])).toBe(0);
  });

  it("desconta corretamente para taxa alta", () => {
    // 2021→2023: dois anos sem bissexto = 730 dias = exatamente 2.0 anos
    const flows: CashFlow[] = [
      { date: new Date("2021-01-01"), amount: -100000 },
      { date: new Date("2023-01-01"), amount: 121000 }, // +21% em 2 anos = 10% a.a.
    ];
    // Com taxa = 10% → VPL ≈ 0
    expect(Math.abs(xnpv(0.1, flows))).toBeLessThan(1);
  });
});
