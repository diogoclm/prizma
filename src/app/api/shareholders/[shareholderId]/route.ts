import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const updateSchema = z.object({
  adminPct: z.number().min(0).max(1).optional(),
  name: z.string().min(1).optional(),
});

/** PATCH /api/shareholders/:id — edita nome/% de administração (referência). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shareholderId: string }> }
) {
  const { shareholderId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const shareholder = await prisma.shareholder.update({
    where: { id: shareholderId },
    data: parsed.data,
  });

  return NextResponse.json(shareholder);
}
