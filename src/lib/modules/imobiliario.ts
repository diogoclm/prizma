import { prisma } from "@/lib/db/client";
import { calcMetrics } from "@/lib/finance/metrics";
import { xirr } from "@/lib/finance/xirr";
import type { CashFlow } from "@/lib/finance/types";
import type { ProjectStage } from "@prisma/client";

export interface SpeMetrics {
  projectId: string;
  name: string;
  stage: ProjectStage;
  ownershipPct: number;

  // Fluxo realizado
  realizedIrr: number | null;
  realizedIrrConverged: boolean;
  realizedMoic: number | null;
  totalInvested: number;
  totalDistributed: number;

  // Fluxo projetado (baseline congelado mais recente)
  baselineIrr: number | null;
  baselineMoic: number | null;
  baselineLabel: string | null;

  // TIR corrente: realizado + reprojeção (fluxos PROJETADOS futuros)
  currentIrr: number | null;
  currentIrrConverged: boolean;

  // Variância
  irrVariancePp: number | null; // pontos percentuais: corrente - baseline
}

/**
 * Calcula as métricas de um projeto imobiliário (SPE).
 * - Entregues: TIR realizada pura.
 * - Em construção / lançamento: realizado + reprojeção (fluxos PROJETADO futuros).
 * - Landbanking: apenas baseline.
 */
export async function calcSpeMetrics(projectId: string): Promise<SpeMetrics> {
  const project = await prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: {
      cashFlowEvents: { orderBy: { date: "asc" } },
      baselines: {
        where: { isFrozen: true },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  const fraction = project.ownershipPct / 100;

  // Fluxos realizados
  const realizedFlows: CashFlow[] = project.cashFlowEvents
    .filter((e) => e.origin === "REALIZADO")
    .map((e) => ({ date: e.date, amount: e.amount * fraction }));

  // Fluxos projetados futuros (para reprojeção)
  const today = new Date();
  const projectedFutureFlows: CashFlow[] = project.cashFlowEvents
    .filter((e) => e.origin === "PROJETADO" && e.date > today)
    .map((e) => ({ date: e.date, amount: e.amount * fraction }));

  // Métricas realizadas
  const totalInvested = realizedFlows
    .filter((cf) => cf.amount < 0)
    .reduce((s, cf) => s + Math.abs(cf.amount), 0);

  const totalDistributed = realizedFlows
    .filter((cf) => cf.amount > 0)
    .reduce((s, cf) => s + cf.amount, 0);

  let realizedIrr: number | null = null;
  let realizedIrrConverged = false;
  let realizedMoic: number | null = null;

  if (realizedFlows.length >= 2) {
    const m = calcMetrics(realizedFlows);
    realizedIrr = m.irr.converged ? m.irr.irr : null;
    realizedIrrConverged = m.irr.converged;
    realizedMoic = m.moic > 0 ? m.moic : null;
  }

  // TIR corrente: realizado + futuro projetado
  let currentIrr: number | null = null;
  let currentIrrConverged = false;

  const combinedFlows = [...realizedFlows, ...projectedFutureFlows];
  if (combinedFlows.length >= 2) {
    const { irr, converged } = xirr(combinedFlows);
    currentIrr = converged ? irr : null;
    currentIrrConverged = converged;
  }

  // Baseline congelado mais recente
  const frozenBaseline = project.baselines[0] ?? null;

  const irrVariancePp =
    currentIrr !== null && frozenBaseline?.projectedIrr != null
      ? (currentIrr - frozenBaseline.projectedIrr) * 100
      : null;

  return {
    projectId,
    name: project.name,
    stage: project.stage,
    ownershipPct: project.ownershipPct,
    realizedIrr,
    realizedIrrConverged,
    realizedMoic,
    totalInvested,
    totalDistributed,
    baselineIrr: frozenBaseline?.projectedIrr ?? null,
    baselineMoic: frozenBaseline?.projectedMoic ?? null,
    baselineLabel: frozenBaseline?.label ?? null,
    currentIrr,
    currentIrrConverged,
    irrVariancePp,
  };
}

/** Calcula métricas de todos os projetos imobiliários. */
export async function calcAllSpeMetrics(): Promise<SpeMetrics[]> {
  const projects = await prisma.project.findMany({
    where: { branch: "IMOBILIARIO" },
    select: { id: true },
  });
  return Promise.all(projects.map((p) => calcSpeMetrics(p.id)));
}
