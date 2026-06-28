import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const createSchema = z.object({
  name: z.string().min(1),
  branch: z.enum(["HOTELEIRO", "IMOBILIARIO"]),
  stage: z.enum(["LANDBANKING", "LANCAMENTO", "CONSTRUCAO", "ENTREGUE", "OPERACAO_CONTINUA", "ENCERRADO"]),
  ownershipPct: z.number().min(0).max(100).optional(),
  description: z.string().optional(),
});

/**
 * POST /api/projects
 * Cria um novo projeto (SPE, terreno, etc.).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      branch: parsed.data.branch,
      stage: parsed.data.stage,
      ownershipPct: parsed.data.ownershipPct ?? 100,
      description: parsed.data.description,
    },
  });

  return NextResponse.json(project, { status: 201 });
}

export async function GET() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects);
}
