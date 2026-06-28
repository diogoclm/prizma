import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { calcHoteleiroMetrics } from "@/lib/modules/hoteleiro";

export async function GET() {
  const hotel = await prisma.project.findFirst({
    where: { branch: "HOTELEIRO" },
    select: { id: true },
  });

  if (!hotel) {
    return NextResponse.json({ error: "Nenhum projeto hoteleiro cadastrado" }, { status: 404 });
  }

  const metrics = await calcHoteleiroMetrics(hotel.id);
  return NextResponse.json(metrics);
}
