import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  stage: z.enum(["LANDBANKING", "LANCAMENTO", "CONSTRUCAO", "ENTREGUE", "OPERACAO_CONTINUA", "ENCERRADO"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: parsed.data,
  });

  return NextResponse.json(project);
}

/**
 * DELETE /api/projects/:projectId
 * Remove o projeto e todos os dados relacionados (cascade: fluxos, baselines, valuations, imports).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ message: "Projeto removido" });
}
