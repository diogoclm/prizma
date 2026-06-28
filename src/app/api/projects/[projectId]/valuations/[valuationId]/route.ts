import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  date: z.string().min(1).optional(),
  value: z.number().positive().optional(),
  method: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  const { valuationId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const valuation = await prisma.valuation.update({
    where: { id: valuationId },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.value !== undefined && { value: parsed.data.value }),
      ...(parsed.data.method !== undefined && { method: parsed.data.method }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
    },
  });

  return NextResponse.json(valuation);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ valuationId: string }> }
) {
  const { valuationId } = await params;
  await prisma.valuation.delete({ where: { id: valuationId } });
  return NextResponse.json({ message: "Removido com sucesso" });
}
