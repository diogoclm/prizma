import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export interface LandbankItem {
  projectId: string;
  name: string;
  totalInvested: number;        // soma de fluxos REALIZADO negativos (compra, ITBI, etc.)
  purchaseEventId: string | null; // id do lançamento principal de compra (editável)
  purchaseDate: string | null;
  purchaseValue: number | null; // valor positivo (preço de compra)
  latestValuationDate: string | null;
  latestValuationValue: number | null;
  variance: number | null;      // valuation - investido (R$)
  variancePct: number | null;   // variação % sobre o investido
  baselineId: string | null;
  baselineLabel: string | null;
  baselineIrr: number | null;
  baselineDeliveryDate: string | null;
  baselineDeliveryValue: number | null;
}

/**
 * GET /api/imobiliario/landbanking
 * Acompanhamento dos terrenos em landbanking (sempre aquisição via compra):
 * investido vs. valor de mercado mais recente, e TIR esperada definida no marco.
 */
export async function GET() {
  const projects = await prisma.project.findMany({
    where: { branch: "IMOBILIARIO", stage: "LANDBANKING" },
    include: {
      cashFlowEvents: { where: { origin: "REALIZADO" }, orderBy: { date: "asc" } },
      valuations: { orderBy: { date: "desc" }, take: 1 },
      baselines: { where: { isFrozen: true }, orderBy: { version: "desc" }, take: 1 },
    },
  });

  const items: LandbankItem[] = projects.map((p) => {
    const negativeFlows = p.cashFlowEvents.filter((e) => e.amount < 0);
    const totalInvested = negativeFlows.reduce((s, e) => s + Math.abs(e.amount), 0);

    // Lançamento principal de compra: o primeiro fluxo negativo realizado (editável direto na tela)
    const purchaseEvent = negativeFlows[0] ?? null;

    const latestValuation = p.valuations[0] ?? null;
    const variance = latestValuation ? latestValuation.value - totalInvested : null;
    const variancePct = variance !== null && totalInvested > 0 ? (variance / totalInvested) * 100 : null;

    const baseline = p.baselines[0] ?? null;
    const flows = (baseline?.projectedCashFlows ?? null) as { date: string; amount: number }[] | null;
    const deliveryFlow = flows && flows.length > 0 ? flows[flows.length - 1] : null;

    return {
      projectId: p.id,
      name: p.name,
      totalInvested,
      purchaseEventId: purchaseEvent?.id ?? null,
      purchaseDate: purchaseEvent?.date.toISOString() ?? null,
      purchaseValue: purchaseEvent ? Math.abs(purchaseEvent.amount) : null,
      latestValuationDate: latestValuation?.date.toISOString() ?? null,
      latestValuationValue: latestValuation?.value ?? null,
      variance,
      variancePct,
      baselineId: baseline?.id ?? null,
      baselineLabel: baseline?.label ?? null,
      baselineIrr: baseline?.projectedIrr ?? null,
      baselineDeliveryDate: deliveryFlow?.date ?? null,
      baselineDeliveryValue: deliveryFlow?.amount ?? null,
    };
  });

  return NextResponse.json(items);
}
