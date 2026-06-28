import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { calcSpeMetrics } from "@/lib/modules/imobiliario";
import { calcHoteleiroMetrics } from "@/lib/modules/hoteleiro";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { branch: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  }

  const metrics =
    project.branch === "HOTELEIRO"
      ? await calcHoteleiroMetrics(projectId)
      : await calcSpeMetrics(projectId);

  return NextResponse.json(metrics);
}
