import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { calcAllSpeMetrics } from "@/lib/modules/imobiliario";
import { calcAdminByProject } from "@/lib/societario/calc";

export async function GET() {
  const [allSpeMetrics, shareholders, payments, manualEntries] = await Promise.all([
    calcAllSpeMetrics(),
    prisma.shareholder.findMany({ orderBy: { order: "asc" } }),
    prisma.shareholderTransaction.findMany({
      where: { type: "ADMINISTRACAO", projectId: { not: null } },
    }),
    prisma.adminManualProject.findMany({ include: { project: { select: { name: true } } } }),
  ]);

  const deliveredProjects = allSpeMetrics
    // ENCERRADO inclui projetos que já foram ENTREGUE e depois fechados — se saldo
    // de administração ficou pendente, encerrar a SPE não pode fazê-lo desaparecer.
    .filter((m) => m.stage === "ENTREGUE" || m.stage === "ENCERRADO")
    .map((m) => ({
      projectId: m.projectId,
      projectName: m.name,
      lucro: m.totalDistributed - m.totalInvested,
    }));

  // Projetos adicionados manualmente (ex: hoteleiro) — lucro informado à mão.
  // Se o projeto também aparece no cálculo automático, o automático prevalece.
  const autoIds = new Set(deliveredProjects.map((p) => p.projectId));
  const manualProjects = manualEntries
    .filter((e) => !autoIds.has(e.projectId))
    .map((e) => ({
      projectId: e.projectId,
      projectName: e.project.name,
      lucro: e.lucro,
    }));

  const administrators = shareholders.map((sh) => ({
    shareholderId: sh.id,
    name: sh.name,
    adminPct: sh.adminPct,
  }));

  const paymentInputs = payments.map((p) => ({
    projectId: p.projectId!,
    shareholderId: p.shareholderId,
    amount: p.amount,
  }));

  const result = calcAdminByProject(
    [...deliveredProjects, ...manualProjects],
    administrators,
    paymentInputs
  );

  const manualById = new Map(manualEntries.map((e) => [e.projectId, e]));
  const enriched = result.map((r) => {
    const manual = !autoIds.has(r.projectId) ? manualById.get(r.projectId) : undefined;
    return {
      ...r,
      isManual: !!manual,
      manualId: manual?.id ?? null,
      manualNotes: manual?.notes ?? null,
    };
  });

  return NextResponse.json(enriched);
}
