import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  liquidCashGenPct: z.number().min(0).optional(),
  liquidCashGen: z.number().min(0).optional(),
  officeDiscount: z.number().min(0).optional(),
  phase: z.string().nullable().optional(),
  phasePct: z.number().min(0).optional(),
  notes: z.string().nullable().optional(),
});

/** PATCH /api/pl/years/:yearId/projects/:projectId — edita projeto/meta do ano. */
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

  const project = await prisma.pLProject.update({
    where: { id: projectId },
    data: parsed.data,
  });

  return NextResponse.json(project);
}

/** DELETE /api/pl/years/:yearId/projects/:projectId — remove projeto/meta do ano. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.pLProject.delete({ where: { id: projectId } });
  return NextResponse.json({ message: "Removido com sucesso" });
}
