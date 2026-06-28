import { prisma } from "@/lib/db/client";
import { xirr } from "@/lib/finance/xirr";
import type { CashFlow } from "@/lib/finance/types";

export interface BaselineInput {
  label: string;
  assumptionVgv?: number;
  assumptionCost?: number;
  assumptionNoi?: number;
  assumptionNotes?: string;
  projectedCashFlows: { date: string; amount: number }[]; // ISO date strings
}

export interface BaselineRecord {
  id: string;
  projectId: string;
  version: number;
  label: string;
  frozenAt: Date;
  isFrozen: boolean;
  assumptionVgv: number | null;
  assumptionCost: number | null;
  assumptionNoi: number | null;
  assumptionNotes: string | null;
  projectedIrr: number | null;
  projectedMoic: number | null;
  projectedNpv: number | null;
  projectedCashFlows: { date: string; amount: number }[] | null;
}

/** Cria um novo baseline (rascunho, ainda não congelado). */
export async function createBaseline(
  projectId: string,
  input: BaselineInput
): Promise<BaselineRecord> {
  const lastVersion = await prisma.baseline.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (lastVersion?.version ?? 0) + 1;

  const { projectedIrr, projectedMoic } = _calcBaselineMetrics(input.projectedCashFlows);

  const b = await prisma.baseline.create({
    data: {
      projectId,
      version: nextVersion,
      label: input.label,
      isFrozen: false,
      assumptionVgv: input.assumptionVgv ?? null,
      assumptionCost: input.assumptionCost ?? null,
      assumptionNoi: input.assumptionNoi ?? null,
      assumptionNotes: input.assumptionNotes ?? null,
      projectedIrr,
      projectedMoic,
      projectedCashFlows: input.projectedCashFlows,
    },
  });

  return _toRecord(b);
}

/**
 * Congela um baseline. Após congelar, nenhuma alteração é permitida.
 * Recalcula as métricas no momento do congelamento.
 */
export async function freezeBaseline(baselineId: string): Promise<BaselineRecord> {
  const existing = await prisma.baseline.findUniqueOrThrow({ where: { id: baselineId } });

  if (existing.isFrozen) {
    throw new Error("Baseline já está congelado e não pode ser alterado.");
  }

  const flows = (existing.projectedCashFlows ?? []) as { date: string; amount: number }[];
  const { projectedIrr, projectedMoic } = _calcBaselineMetrics(flows);

  const b = await prisma.baseline.update({
    where: { id: baselineId },
    data: {
      isFrozen: true,
      frozenAt: new Date(),
      projectedIrr,
      projectedMoic,
    },
  });

  return _toRecord(b);
}

/** Atualiza um baseline NÃO congelado. */
export async function updateBaseline(
  baselineId: string,
  input: Partial<BaselineInput>
): Promise<BaselineRecord> {
  const existing = await prisma.baseline.findUniqueOrThrow({ where: { id: baselineId } });

  if (existing.isFrozen) {
    throw new Error("Baseline congelado não pode ser alterado.");
  }

  const flows = input.projectedCashFlows ??
    ((existing.projectedCashFlows ?? []) as { date: string; amount: number }[]);

  const { projectedIrr, projectedMoic } = _calcBaselineMetrics(flows);

  const b = await prisma.baseline.update({
    where: { id: baselineId },
    data: {
      label: input.label ?? existing.label,
      assumptionVgv: input.assumptionVgv ?? existing.assumptionVgv,
      assumptionCost: input.assumptionCost ?? existing.assumptionCost,
      assumptionNoi: input.assumptionNoi ?? existing.assumptionNoi,
      assumptionNotes: input.assumptionNotes ?? existing.assumptionNotes,
      projectedCashFlows: flows,
      projectedIrr,
      projectedMoic,
    },
  });

  return _toRecord(b);
}

export async function listBaselines(projectId: string): Promise<BaselineRecord[]> {
  const baselines = await prisma.baseline.findMany({
    where: { projectId },
    orderBy: { version: "asc" },
  });
  return baselines.map(_toRecord);
}

export async function getBaseline(baselineId: string): Promise<BaselineRecord> {
  const b = await prisma.baseline.findUniqueOrThrow({ where: { id: baselineId } });
  return _toRecord(b);
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function _calcBaselineMetrics(flows: { date: string; amount: number }[]) {
  if (flows.length < 2) return { projectedIrr: null, projectedMoic: null };

  const cashFlows: CashFlow[] = flows.map((f) => ({
    date: new Date(f.date),
    amount: f.amount,
  }));

  const totalInvested = cashFlows
    .filter((cf) => cf.amount < 0)
    .reduce((s, cf) => s + Math.abs(cf.amount), 0);
  const totalReturn = cashFlows
    .filter((cf) => cf.amount > 0)
    .reduce((s, cf) => s + cf.amount, 0);

  const { irr, converged } = xirr(cashFlows);

  return {
    projectedIrr: converged ? irr : null,
    projectedMoic: totalInvested > 0 ? totalReturn / totalInvested : null,
  };
}

function _toRecord(b: {
  id: string;
  projectId: string;
  version: number;
  label: string;
  frozenAt: Date;
  isFrozen: boolean;
  assumptionVgv: number | null;
  assumptionCost: number | null;
  assumptionNoi: number | null;
  assumptionNotes: string | null;
  projectedIrr: number | null;
  projectedMoic: number | null;
  projectedNpv: number | null;
  projectedCashFlows: unknown;
}): BaselineRecord {
  return {
    id: b.id,
    projectId: b.projectId,
    version: b.version,
    label: b.label,
    frozenAt: b.frozenAt,
    isFrozen: b.isFrozen,
    assumptionVgv: b.assumptionVgv,
    assumptionCost: b.assumptionCost,
    assumptionNoi: b.assumptionNoi,
    assumptionNotes: b.assumptionNotes,
    projectedIrr: b.projectedIrr,
    projectedMoic: b.projectedMoic,
    projectedNpv: b.projectedNpv,
    projectedCashFlows: b.projectedCashFlows as { date: string; amount: number }[] | null,
  };
}
