import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { CASH_FLOW_TYPES, CASH_FLOW_ORIGINS } from "@/lib/import/schema";

const createSchema = z.object({
  date: z.string().min(1),
  amount: z.number().refine((v) => v !== 0, { message: "Valor não pode ser zero" }),
  type: z.enum(CASH_FLOW_TYPES),
  origin: z.enum(CASH_FLOW_ORIGINS),
  description: z.string().optional(),
});

/**
 * POST /api/projects/:projectId/cashflows
 * Lança um único evento de fluxo de caixa direto pelo painel (sem precisar de planilha).
 * Uso recomendado: carga inicial em massa via importação; lançamentos do dia a dia aqui.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const event = await prisma.cashFlowEvent.create({
    data: {
      projectId,
      date: new Date(parsed.data.date),
      amount: parsed.data.amount,
      type: parsed.data.type,
      origin: parsed.data.origin,
      description: parsed.data.description,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

/**
 * GET /api/projects/:projectId/cashflows
 * Lista os eventos do projeto, mais recentes primeiro.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const events = await prisma.cashFlowEvent.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(events);
}
