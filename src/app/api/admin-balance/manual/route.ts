import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const upsertSchema = z.object({
  projectId: z.string().min(1),
  lucro: z.number(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin-balance/manual — inclui (ou atualiza) um projeto manualmente
 * no saldo de administração, informando o lucro à mão.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.adminManualProject.upsert({
    where: { projectId: parsed.data.projectId },
    create: {
      projectId: parsed.data.projectId,
      lucro: parsed.data.lucro,
      notes: parsed.data.notes,
    },
    update: {
      lucro: parsed.data.lucro,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
