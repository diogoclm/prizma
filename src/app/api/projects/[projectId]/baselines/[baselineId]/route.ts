import { NextRequest, NextResponse } from "next/server";
import { freezeBaseline, updateBaseline, getBaseline } from "@/lib/baseline/service";
import { prisma } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; baselineId: string }> }
) {
  const { baselineId } = await params;
  try {
    const b = await getBaseline(baselineId);
    return NextResponse.json(b);
  } catch {
    return NextResponse.json({ error: "Baseline não encontrado" }, { status: 404 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; baselineId: string }> }
) {
  const { baselineId } = await params;
  const body = await req.json();

  try {
    // Ação especial: congelar
    if (body.action === "freeze") {
      const b = await freezeBaseline(baselineId);
      return NextResponse.json(b);
    }
    // Atualização normal (rascunho)
    const b = await updateBaseline(baselineId, body);
    return NextResponse.json(b);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/projects/:projectId/baselines/:baselineId
 * Remove um baseline (congelado ou não). Útil pra corrigir marcos criados por erro.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ baselineId: string }> }
) {
  const { baselineId } = await params;
  await prisma.baseline.delete({ where: { id: baselineId } });
  return NextResponse.json({ message: "Baseline removido" });
}
