import { NextRequest, NextResponse } from "next/server";
import { createBaseline, listBaselines } from "@/lib/baseline/service";
import { z } from "zod";

const createSchema = z.object({
  label: z.string().min(1),
  assumptionVgv: z.number().optional(),
  assumptionCost: z.number().optional(),
  assumptionNoi: z.number().optional(),
  assumptionNotes: z.string().optional(),
  projectedCashFlows: z.array(
    z.object({ date: z.string(), amount: z.number() })
  ).min(2, "Mínimo de 2 fluxos projetados"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const baselines = await listBaselines(projectId);
  return NextResponse.json(baselines);
}

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

  const baseline = await createBaseline(projectId, parsed.data);
  return NextResponse.json(baseline, { status: 201 });
}
