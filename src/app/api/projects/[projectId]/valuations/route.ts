import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const createSchema = z.object({
  date: z.string().min(1),
  value: z.number().positive("Valor da marcação deve ser positivo"),
  method: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/projects/:projectId/valuations
 * Lança uma nova marcação a mercado (usado pelo hoteleiro como terminal value).
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

  const valuation = await prisma.valuation.create({
    data: {
      projectId,
      date: new Date(parsed.data.date),
      value: parsed.data.value,
      method: parsed.data.method,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(valuation, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const valuations = await prisma.valuation.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(valuations);
}
