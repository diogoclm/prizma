import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const createSchema = z.object({
  date: z.string().min(1),
  amount: z.number().positive("Valor deve ser positivo"),
  type: z.enum(["APORTE", "DIVIDENDO", "ADMINISTRACAO"]),
  reason: z.string().optional(),
  source: z.string().optional(),
  projectId: z.string().optional(),
});

/** POST /api/shareholders/:id/transactions — lança aporte, dividendo ou administração. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shareholderId: string }> }
) {
  const { shareholderId } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tx = await prisma.shareholderTransaction.create({
    data: {
      shareholderId,
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      type: parsed.data.type,
      reason: parsed.data.reason,
      source: parsed.data.source,
      projectId: parsed.data.projectId,
    },
  });

  return NextResponse.json(tx, { status: 201 });
}

/** GET /api/shareholders/:id/transactions — histórico do acionista. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareholderId: string }> }
) {
  const { shareholderId } = await params;
  const txs = await prisma.shareholderTransaction.findMany({
    where: { shareholderId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(txs);
}
