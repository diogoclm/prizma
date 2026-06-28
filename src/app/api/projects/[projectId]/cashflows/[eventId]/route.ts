import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { CASH_FLOW_TYPES, CASH_FLOW_ORIGINS } from "@/lib/import/schema";

const updateSchema = z.object({
  date: z.string().min(1).optional(),
  amount: z.number().refine((v) => v !== 0, { message: "Valor não pode ser zero" }).optional(),
  type: z.enum(CASH_FLOW_TYPES).optional(),
  origin: z.enum(CASH_FLOW_ORIGINS).optional(),
  description: z.string().optional(),
});

/**
 * PATCH /api/projects/:projectId/cashflows/:eventId
 * Edita um lançamento existente (data, valor, tipo, origem, descrição).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.cashFlowEvent.update({
    where: { id: eventId },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.type && { type: parsed.data.type }),
      ...(parsed.data.origin && { origin: parsed.data.origin }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    },
  });

  return NextResponse.json(event);
}

/**
 * DELETE /api/projects/:projectId/cashflows/:eventId
 * Remove um lançamento manual (ou importado) individual.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  await prisma.cashFlowEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ message: "Removido com sucesso" });
}
