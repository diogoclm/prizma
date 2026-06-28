import { prisma } from "@/lib/db/client";
import { calcMetricsWithResidual } from "@/lib/finance/metrics";
import { xirr } from "@/lib/finance/xirr";
import type { CashFlow } from "@/lib/finance/types";

export interface HoteleiroMetrics {
  projectId: string;
  name: string;
  ownershipPct: number;

  // Capital da Prizma (após aplicar ownership)
  totalInvested: number;        // aportes totais (fração da Prizma)
  totalDistributed: number;     // distribuições recebidas

  // Marcação a mercado mais recente
  latestValuationDate: Date | null;
  latestValuationTotal: number | null; // valor total do projeto
  residualValue: number | null;        // fração da Prizma

  // Métricas com terminal value (valuation atual)
  irr: number | null;
  irrConverged: boolean;
  dpi: number;   // Distributed to Paid-In
  rvpi: number;  // Residual Value to Paid-In
  tvpi: number;  // Total Value to Paid-In

  // TIR esperada: realizado + distribuições futuras projetadas
  expectedIrr: number | null;
  expectedIrrConverged: boolean;

  // Baseline (marco inicial, se existir)
  baselineIrr: number | null;
  baselineMoic: number | null;
  baselineLabel: string | null;

  // Variância em p.p.
  irrVariancePp: number | null;
}

export async function calcHoteleiroMetrics(projectId: string): Promise<HoteleiroMetrics> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      cashFlowEvents: { orderBy: { date: "asc" } },
      valuations: { orderBy: { date: "desc" }, take: 1 },
      baselines: {
        where: { isFrozen: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  // Fluxos operacionais realizados (sem valor terminal — esse vem da valuation).
  // Os lançamentos já são exclusivos da fração da Prizma — não multiplicar por ownershipPct aqui.
  const operatingFlows: CashFlow[] = project.cashFlowEvents
    .filter((e) => e.origin === "REALIZADO" && e.type !== "VALOR_TERMINAL")
    .map((e) => ({ date: e.date, amount: e.amount }));

  const totalInvested = operatingFlows
    .filter((cf) => cf.amount < 0)
    .reduce((s, cf) => s + Math.abs(cf.amount), 0);

  const totalDistributed = operatingFlows
    .filter((cf) => cf.amount > 0)
    .reduce((s, cf) => s + cf.amount, 0);

  // Valuation mais recente como terminal value
  const latestValuation = project.valuations[0] ?? null;
  const residualValue = latestValuation
    ? latestValuation.value * (project.ownershipPct / 100)
    : null;

  let irr: number | null = null;
  let irrConverged = false;
  let dpi = 0, rvpi = 0, tvpi = 0;

  if (operatingFlows.length >= 1 && residualValue !== null && latestValuation) {
    const m = calcMetricsWithResidual(operatingFlows, residualValue, latestValuation.date);
    irr = m.irr.converged ? m.irr.irr : null;
    irrConverged = m.irr.converged;
    dpi = m.dpi;
    rvpi = m.rvpi;
    tvpi = m.tvpi;
  } else if (totalInvested > 0) {
    dpi = totalDistributed / totalInvested;
    tvpi = dpi;
  }

  // TIR esperada: realizados + projetados futuros (já na fração da Prizma)
  const today = new Date();
  const projectedFuture: CashFlow[] = project.cashFlowEvents
    .filter((e) => e.origin === "PROJETADO" && e.date > today)
    .map((e) => ({ date: e.date, amount: e.amount }));

  let expectedIrr: number | null = null;
  let expectedIrrConverged = false;

  if (operatingFlows.length >= 1 && projectedFuture.length >= 1) {
    // Inclui o residual atual como "ponto de ancoragem" da projeção futura
    const combined: CashFlow[] = residualValue && latestValuation
      ? [...operatingFlows, { date: latestValuation.date, amount: -residualValue }, ...projectedFuture]
      : [...operatingFlows, ...projectedFuture];

    const { irr: eIrr, converged } = xirr(combined);
    expectedIrr = converged ? eIrr : null;
    expectedIrrConverged = converged;
  }

  const frozenBaseline = project.baselines[0] ?? null;

  const irrVariancePp =
    irr !== null && frozenBaseline?.projectedIrr != null
      ? (irr - frozenBaseline.projectedIrr) * 100
      : null;

  return {
    projectId,
    name: project.name,
    ownershipPct: project.ownershipPct,
    totalInvested,
    totalDistributed,
    latestValuationDate: latestValuation?.date ?? null,
    latestValuationTotal: latestValuation?.value ?? null,
    residualValue,
    irr,
    irrConverged,
    dpi,
    rvpi,
    tvpi,
    expectedIrr,
    expectedIrrConverged,
    baselineIrr: frozenBaseline?.projectedIrr ?? null,
    baselineMoic: frozenBaseline?.projectedMoic ?? null,
    baselineLabel: frozenBaseline?.label ?? null,
    irrVariancePp,
  };
}
