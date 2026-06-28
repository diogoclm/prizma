/**
 * Lógica pura de fechamento de SPE: monta o snapshot de variância final.
 * Sem dependência de Prisma — usado pela rota da API e testável isoladamente.
 */

export interface ClosureMetricsInput {
  realizedIrr: number | null;
  realizedMoic: number | null;
  baselineIrr: number | null;
  baselineMoic: number | null;
  totalInvested: number;
  totalDistributed: number;
}

export interface ClosureSnapshot {
  closureDate: string; // ISO date
  realizedIrr: number | null;
  realizedMoic: number | null;
  baselineIrr: number | null;
  baselineMoic: number | null;
  irrVariancePp: number | null;
  moicVariance: number | null;
  totalInvested: number;
  totalDistributed: number;
  verdict: "ACIMA" | "ABAIXO" | "ADERENTE" | "SEM_BASELINE";
  noteText: string;
}

const ADHERENCE_THRESHOLD_PP = 1.0; // dentro de ±1 p.p. considera aderente

export function buildClosureSnapshot(
  input: ClosureMetricsInput,
  closureDate: Date
): ClosureSnapshot {
  const irrVariancePp =
    input.realizedIrr !== null && input.baselineIrr !== null
      ? (input.realizedIrr - input.baselineIrr) * 100
      : null;

  const moicVariance =
    input.realizedMoic !== null && input.baselineMoic !== null
      ? input.realizedMoic - input.baselineMoic
      : null;

  let verdict: ClosureSnapshot["verdict"] = "SEM_BASELINE";
  if (irrVariancePp !== null) {
    if (Math.abs(irrVariancePp) <= ADHERENCE_THRESHOLD_PP) verdict = "ADERENTE";
    else if (irrVariancePp > 0) verdict = "ACIMA";
    else verdict = "ABAIXO";
  }

  const dateStr = closureDate.toISOString().split("T")[0];
  const noteLines = [
    `--- FECHAMENTO ${dateStr} ---`,
    `TIR realizada: ${input.realizedIrr !== null ? (input.realizedIrr * 100).toFixed(2) + "%" : "N/A"}`,
    `MOIC realizado: ${input.realizedMoic?.toFixed(2) ?? "N/A"}x`,
    `TIR baseline: ${input.baselineIrr !== null ? (input.baselineIrr * 100).toFixed(2) + "%" : "N/A"}`,
    `Variância: ${irrVariancePp !== null ? irrVariancePp.toFixed(1) + " p.p." : "N/A"} (${verdict})`,
    `Total investido: R$ ${input.totalInvested.toLocaleString("pt-BR")}`,
    `Total distribuído: R$ ${input.totalDistributed.toLocaleString("pt-BR")}`,
  ];

  return {
    closureDate: dateStr,
    realizedIrr: input.realizedIrr,
    realizedMoic: input.realizedMoic,
    baselineIrr: input.baselineIrr,
    baselineMoic: input.baselineMoic,
    irrVariancePp,
    moicVariance,
    totalInvested: input.totalInvested,
    totalDistributed: input.totalDistributed,
    verdict,
    noteText: noteLines.join("\n"),
  };
}
