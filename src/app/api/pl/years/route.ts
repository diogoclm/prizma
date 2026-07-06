import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";

const createSchema = z.object({
  year: z.number().int(),
  averageSalary: z.number().min(0).optional(),
  salaryMultiplier: z.number().min(0).optional(),
  amountPaid: z.number().min(0).optional(),
});

/** GET /api/pl/years — lista todos os anos de PL com projetos. */
export async function GET() {
  const years = await prisma.pLYear.findMany({
    orderBy: { year: "desc" },
    include: { projects: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(years);
}

/** POST /api/pl/years — cria um novo ano de PL. */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const plYear = await prisma.pLYear.create({
    data: parsed.data,
  });

  return NextResponse.json(plYear, { status: 201 });
}
