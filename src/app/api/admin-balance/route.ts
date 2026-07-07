import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { calcAllSpeMetrics } from "@/lib/modules/imobiliario";
import { calcAdminByProject } from "@/lib/societario/calc";

export async function GET() {
  const [allSpeMetrics, shareholders, payments] = await Promise.all([
    calcAllSpeMetrics(),
    prisma.shareholder.findMany({ orderBy: { order: "asc" } }),
    prisma.shareholderTransaction.findMany({
      where: { type: "ADMINISTRACAO", projectId: { not: null } },
    }),
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

  const result = calcAdminByProject(deliveredProjects, administrators, paymentInputs);

  return NextResponse.json(result);
}
