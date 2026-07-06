import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const createSchema = z.object({
  name: z.string().min(1),
  liquidCashGenPct: z.number().min(0).optional(),
  liquidCashGen: z.number().min(0).optional(),
  officeDiscount: z.number().min(0).optional(),
  phase: z.string().optional(),
  phasePct: z.number().min(0).optional(),
  notes: z.string().optional(),
});

/** POST /api/pl/years/:id/projects — adiciona projeto/meta entregue ao ano. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ yearId: string }> }
) {
  const { yearId } = await params;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.pLProject.create({
    data: {
      plYearId: yearId,
      ...parsed.data,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
