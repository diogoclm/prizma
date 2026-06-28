import { NextResponse } from "next/server";
import { calcAllSpeMetrics } from "@/lib/modules/imobiliario";

export async function GET() {
  const metrics = await calcAllSpeMetrics();
  return NextResponse.json(metrics);
}
