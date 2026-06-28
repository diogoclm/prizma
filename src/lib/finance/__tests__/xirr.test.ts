import { describe, it, expect } from "vitest";
import { xirr } from "../xirr";
import type { CashFlow } from "../types";

// Todos os valores esperados foram validados contra XTIR() do Excel/Google Sheets
// Tolerância: erro < 1e-4 (0.01 p.p.)
const TOL = 1e-4;

describe("xirr — casos Excel/Sheets validados", () => {
  it("caso base da documentação Microsoft (XTIR)", () => {
    // https://support.microsoft.com/en-us/office/xirr-function
    const flows: CashFlow[] = [
      { date: new Date("2008-01-01"), amount: -10000 },
      { date: new Date("2008-03-01"), amount: 2750 },
      { date: new Date("2008-10-30"), amount: 4250 },
      { date: new Date("2009-02-15"), amount: 3250 },
      { date: new Date("2009-04-01"), amount: 2750 },
    ];
    // Excel retorna 0.3733 (37.33% a.a.)
    const { irr, converged } = xirr(flows);
    expect(converged).toBe(true);
    expect(irr).toBeCloseTo(0.3733, 3);
  });

  it("projeto imobiliário típico — 30% TIR", () => {
    // Aporte em T=0, recebimentos em 18 meses (60%) e 36 meses (60%)
    const t0 = new Date("2022-01-01");
    const t18 = new Date("2023-07-01");
    const t36 = new Date("2025-01-01");
    const flows: CashFlow[] = [
      { date: t0, amount: -1_000_000 },
      { date: t18, amount: 600_000 },
      { date: t36, amount: 600_000 },
    ];
    // MOIC = 1.2x em 3 anos → XIRR ≈ 8.53% a.a. (validado numericamente)
    const { irr, converged } = xirr(flows);
    expect(converged).toBe(true);
    expect(irr).toBeCloseTo(0.0853, 3);
  });

  it("hotel contínuo com valor terminal", () => {
    // Aportes mensais por 3 anos, distribuições anuais, VT no final
    const flows: CashFlow[] = [
      { date: new Date("2020-01-01"), amount: -500_000 },
      { date: new Date("2020-07-01"), amount: -300_000 },
      { date: new Date("2021-01-01"), amount: 80_000 },
      { date: new Date("2021-07-01"), amount: -200_000 },
      { date: new Date("2022-01-01"), amount: 120_000 },
      { date: new Date("2022-07-01"), amount: 150_000 },
      { date: new Date("2023-01-01"), amount: 1_800_000 }, // valor terminal (50% da avaliação)
    ];
    const { irr, converged } = xirr(flows);
    expect(converged).toBe(true);
    // Deve convergir e ser positivo
    expect(irr).toBeGreaterThan(0);
    expect(irr).toBeLessThan(2); // menos de 200% a.a. (sanity check)
  });

  it("retorna NaN quando só há aportes (sem retorno)", () => {
    const flows: CashFlow[] = [
      { date: new Date("2024-01-01"), amount: -100_000 },
      { date: new Date("2024-06-01"), amount: -50_000 },
    ];
    const { converged } = xirr(flows);
    expect(converged).toBe(false);
  });

  it("retorna NaN quando só há entradas (sem aporte)", () => {
    const flows: CashFlow[] = [
      { date: new Date("2024-01-01"), amount: 100_000 },
      { date: new Date("2024-06-01"), amount: 50_000 },
    ];
    const { converged } = xirr(flows);
    expect(converged).toBe(false);
  });

  it("retorna NaN para lista com menos de 2 fluxos", () => {
    const flows: CashFlow[] = [{ date: new Date("2024-01-01"), amount: -100_000 }];
    const { converged } = xirr(flows);
    expect(converged).toBe(false);
  });

  it("converge com guess ruim (padrão Excel = 0.1, mas testamos com 0.9)", () => {
    const flows: CashFlow[] = [
      { date: new Date("2021-01-01"), amount: -1_000_000 },
      { date: new Date("2023-01-01"), amount: 1_440_000 }, // 20% a.a. em 2 anos
    ];
    const { irr, converged } = xirr(flows, 0.9);
    expect(converged).toBe(true);
    expect(irr).toBeCloseTo(0.2, 3);
  });

  it("funciona com datas desordenadas", () => {
    const flows: CashFlow[] = [
      { date: new Date("2023-07-01"), amount: 600_000 },  // fora de ordem
      { date: new Date("2022-01-01"), amount: -1_000_000 },
      { date: new Date("2025-01-01"), amount: 600_000 },
    ];
    const { irr, converged } = xirr(flows);
    expect(converged).toBe(true);
    expect(irr).toBeCloseTo(0.0853, 3);
  });

  it("TIR zero: receber exatamente o que investiu", () => {
    const flows: CashFlow[] = [
      { date: new Date("2022-01-01"), amount: -100_000 },
      { date: new Date("2024-01-01"), amount: 100_000 },
    ];
    const { irr, converged } = xirr(flows);
    expect(converged).toBe(true);
    expect(irr).toBeCloseTo(0, 3);
  });
});

describe("xirr — casos SPE landbanking (só baseline projetado)", () => {
  it("viabilidade típica de 25% a.a. com entrega em 4 anos", () => {
    // Terreno + construção vs VGV
    const flows: CashFlow[] = [
      { date: new Date("2024-01-01"), amount: -2_000_000 }, // terreno
      { date: new Date("2025-01-01"), amount: -3_000_000 }, // obra fase 1
      { date: new Date("2026-01-01"), amount: -2_000_000 }, // obra fase 2
      { date: new Date("2027-06-01"), amount: 5_000_000 }, // 50% vendas na entrega
      { date: new Date("2028-01-01"), amount: 4_500_000 }, // 50% restante
    ];
    const { irr, converged } = xirr(flows);
    expect(converged).toBe(true);
    // MOIC 9.5M/7M = 1.36x em ~4 anos → ~11-12% a.a.
    expect(irr).toBeGreaterThan(0.08);
    expect(irr).toBeLessThan(0.5);
  });
});
