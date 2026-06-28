import { describe, it, expect } from "vitest";
import { buildClosureSnapshot } from "../service";

describe("buildClosureSnapshot", () => {
  it("classifica ACIMA quando TIR realizada supera baseline além do limiar", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: 0.25,
        realizedMoic: 1.8,
        baselineIrr: 0.20,
        baselineMoic: 1.6,
        totalInvested: 3_000_000,
        totalDistributed: 5_400_000,
      },
      new Date("2026-01-01")
    );
    expect(s.verdict).toBe("ACIMA");
    expect(s.irrVariancePp).toBeCloseTo(5, 4);
    expect(s.moicVariance).toBeCloseTo(0.2, 4);
  });

  it("classifica ABAIXO quando TIR realizada fica abaixo do baseline além do limiar", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: 0.12,
        realizedMoic: 1.3,
        baselineIrr: 0.20,
        baselineMoic: 1.6,
        totalInvested: 2_000_000,
        totalDistributed: 2_600_000,
      },
      new Date("2026-01-01")
    );
    expect(s.verdict).toBe("ABAIXO");
    expect(s.irrVariancePp).toBeCloseTo(-8, 4);
  });

  it("classifica ADERENTE quando variância dentro de ±1 p.p.", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: 0.205,
        realizedMoic: 1.61,
        baselineIrr: 0.20,
        baselineMoic: 1.6,
        totalInvested: 1_000_000,
        totalDistributed: 1_610_000,
      },
      new Date("2026-01-01")
    );
    expect(s.verdict).toBe("ADERENTE");
  });

  it("classifica SEM_BASELINE quando não há baseline congelado", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: 0.18,
        realizedMoic: 1.4,
        baselineIrr: null,
        baselineMoic: null,
        totalInvested: 500_000,
        totalDistributed: 700_000,
      },
      new Date("2026-01-01")
    );
    expect(s.verdict).toBe("SEM_BASELINE");
    expect(s.irrVariancePp).toBeNull();
  });

  it("limiar de aderência é exatamente inclusivo (1.0 p.p. ainda é aderente)", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: 0.21,
        realizedMoic: 1.6,
        baselineIrr: 0.20,
        baselineMoic: 1.6,
        totalInvested: 1_000_000,
        totalDistributed: 1_600_000,
      },
      new Date("2026-01-01")
    );
    expect(s.irrVariancePp).toBeCloseTo(1, 4);
    expect(s.verdict).toBe("ADERENTE");
  });

  it("gera noteText com data de fechamento formatada e verdict", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: 0.25,
        realizedMoic: 1.8,
        baselineIrr: 0.20,
        baselineMoic: 1.6,
        totalInvested: 3_000_000,
        totalDistributed: 5_400_000,
      },
      new Date("2026-03-15")
    );
    expect(s.closureDate).toBe("2026-03-15");
    expect(s.noteText).toContain("FECHAMENTO 2026-03-15");
    expect(s.noteText).toContain("ACIMA");
    expect(s.noteText).toContain("25.00%");
  });

  it("trata realizedIrr nulo (projeto sem retorno ainda) sem quebrar", () => {
    const s = buildClosureSnapshot(
      {
        realizedIrr: null,
        realizedMoic: null,
        baselineIrr: 0.20,
        baselineMoic: 1.6,
        totalInvested: 1_000_000,
        totalDistributed: 0,
      },
      new Date("2026-01-01")
    );
    expect(s.verdict).toBe("SEM_BASELINE");
    expect(s.noteText).toContain("N/A");
  });
});
