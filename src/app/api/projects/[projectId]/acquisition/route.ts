import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const schema = z.object({
  acquisitionType: z.enum(["COMPRA", "PERMUTA"]),
  permutaDetails: z.string().optional(),
});

/**
 * PATCH /api/projects/:projectId/acquisition
 * Define a forma de aquisição do terreno (compra em dinheiro ou permuta).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      acquisitionType: parsed.data.acquisitionType,
      permutaDetails: parsed.data.permutaDetails,
    },
  });

  return NextResponse.json(project);
}
