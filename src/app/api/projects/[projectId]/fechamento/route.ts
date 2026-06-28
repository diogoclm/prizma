import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { calcSpeMetrics } from "@/lib/modules/imobiliario";
import { buildClosureSnapshot } from "@/lib/closure/service";

/**
 * POST /api/projects/:projectId/fechamento
 * Encerra uma SPE: muda o stage para ENCERRADO, grava as métricas finais
 * no baseline congelado mais recente como snapshot de fechamento.
 *
 * Body (opcional): { closureDate: "YYYY-MM-DD" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));
  const closureDate = body.closureDate ? new Date(body.closureDate) : new Date();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { branch: true, stage: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }
  if (project.branch !== "IMOBILIARIO") {
    return NextResponse.json({ error: "Fechamento disponível apenas para projetos imobiliários" }, { status: 400 });
  }
  if (project.stage === "ENCERRADO") {
    return NextResponse.json({ error: "Projeto já encerrado" }, { status: 400 });
  }

  const finalMetrics = await calcSpeMetrics(projectId);

  const snapshot = buildClosureSnapshot(
    {
      realizedIrr: finalMetrics.realizedIrr,
      realizedMoic: finalMetrics.realizedMoic,
      baselineIrr: finalMetrics.baselineIrr,
      baselineMoic: finalMetrics.baselineMoic,
      totalInvested: finalMetrics.totalInvested,
      totalDistributed: finalMetrics.totalDistributed,
    },
    closureDate
  );

  await prisma.project.update({
    where: { id: projectId },
    data: { stage: "ENCERRADO", closureDate },
  });

  const latestBaseline = await prisma.baseline.findFirst({
    where: { projectId, isFrozen: true },
    orderBy: { version: "desc" },
  });

  if (latestBaseline) {
    await prisma.baseline.update({
      where: { id: latestBaseline.id },
      data: {
        assumptionNotes: [latestBaseline.assumptionNotes ?? "", snapshot.noteText]
          .filter(Boolean)
          .join("\n"),
      },
    });
  }

  return NextResponse.json({
    message: "Projeto encerrado com sucesso",
    snapshot,
  });
}
