import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

/** GET /api/shareholders — lista acionistas com transações (pra calcular resumo no client). */
export async function GET() {
  const shareholders = await prisma.shareholder.findMany({
    orderBy: { order: "asc" },
    include: { transactions: { orderBy: { date: "desc" } } },
  });
  return NextResponse.json(shareholders);
}
