import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  date: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["APORTE", "DIVIDENDO", "ADMINISTRACAO"]).optional(),
  reason: z.string().optional(),
  source: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  const { txId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tx = await prisma.shareholderTransaction.update({
    where: { id: txId },
    data: {
      ...(parsed.data.date && { date: new Date(parsed.data.date) }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.type && { type: parsed.data.type }),
      ...(parsed.data.reason !== undefined && { reason: parsed.data.reason }),
      ...(parsed.data.source !== undefined && { source: parsed.data.source }),
    },
  });

  return NextResponse.json(tx);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  const { txId } = await params;
  await prisma.shareholderTransaction.delete({ where: { id: txId } });
  return NextResponse.json({ message: "Removido com sucesso" });
}
