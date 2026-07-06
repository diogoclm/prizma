import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  averageSalary: z.number().min(0).optional(),
  salaryMultiplier: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
  evaluationScore: z.number().min(0).max(1).nullable().optional(),
  evaluationNotes: z.string().nullable().optional(),
});

/** PATCH /api/pl/years/:id — edita salário médio, teto, valor pago e avaliação do ano. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ yearId: string }> }
) {
  const { yearId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plYear = await prisma.pLYear.update({
    where: { id: yearId },
    data: parsed.data,
  });

  return NextResponse.json(plYear);
}

/** DELETE /api/pl/years/:id — remove o ano (e seus projetos, em cascata). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ yearId: string }> }
) {
  const { yearId } = await params;
  await prisma.pLYear.delete({ where: { id: yearId } });
  return NextResponse.json({ message: "Removido com sucesso" });
}
