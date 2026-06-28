import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { calcAllSpeMetrics } from "@/lib/modules/imobiliario";
import { prisma } from "@/lib/db/client";
import { calcHoteleiroMetrics } from "@/lib/modules/hoteleiro";

function pct(v: number | null) {
  if (v === null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

function brl(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * GET /api/relatorios
 * Gera e devolve um arquivo XLSX com o relatório consolidado de todos os projetos.
 */
export async function GET() {
  const [spes, hotelProject] = await Promise.all([
    calcAllSpeMetrics(),
    prisma.project.findFirst({ where: { branch: "HOTELEIRO" }, select: { id: true } }),
  ]);

  const hotel = hotelProject ? await calcHoteleiroMetrics(hotelProject.id) : null;

  const wb = XLSX.utils.book_new();

  // ── Aba 1: Incorporação ───────────────────────────────────────────────────
  const speRows = spes.map((p) => ({
    "Projeto": p.name,
    "Estágio": p.stage,
    "Ownership (%)": p.ownershipPct,
    "Investido (R$)": brl(p.totalInvested),
    "Distribuído (R$)": brl(p.totalDistributed),
    "TIR Baseline": pct(p.baselineIrr),
    "TIR Corrente": pct(p.currentIrr),
    "TIR Realizada": pct(p.realizedIrr),
    "MOIC Realizado": p.realizedMoic?.toFixed(2) ?? "—",
    "Variância (p.p.)": p.irrVariancePp?.toFixed(1) ?? "—",
    "Baseline Label": p.baselineLabel ?? "—",
  }));

  const wsImob = XLSX.utils.json_to_sheet(speRows);
  XLSX.utils.book_append_sheet(wb, wsImob, "Incorporação");

  // ── Aba 2: Hoteleiro ────────────────────────────────────────────────────
  if (hotel) {
    const hotelRows = [
      { "Campo": "Projeto", "Valor": hotel.name },
      { "Campo": "Ownership (%)", "Valor": hotel.ownershipPct },
      { "Campo": "Investido — Prizma (R$)", "Valor": brl(hotel.totalInvested) },
      { "Campo": "Distribuições recebidas (R$)", "Valor": brl(hotel.totalDistributed) },
      { "Campo": "Valor residual Prizma (R$)", "Valor": hotel.residualValue ? brl(hotel.residualValue) : "—" },
      { "Campo": "TIR atual (c/ valuation)", "Valor": pct(hotel.irr) },
      { "Campo": "TIR esperada (c/ projeção)", "Valor": pct(hotel.expectedIrr) },
      { "Campo": "TIR baseline", "Valor": pct(hotel.baselineIrr) },
      { "Campo": "DPI", "Valor": hotel.dpi.toFixed(2) + "x" },
      { "Campo": "RVPI", "Valor": hotel.rvpi.toFixed(2) + "x" },
      { "Campo": "TVPI", "Valor": hotel.tvpi.toFixed(2) + "x" },
      { "Campo": "Variância vs. baseline (p.p.)", "Valor": hotel.irrVariancePp?.toFixed(1) ?? "—" },
    ];
    const wsHotel = XLSX.utils.json_to_sheet(hotelRows);
    XLSX.utils.book_append_sheet(wb, wsHotel, "Hoteleiro");
  }

  // ── Aba 3: Consolidado ──────────────────────────────────────────────────
  const totalImob = spes.reduce((s, p) => s + p.totalInvested, 0);
  const totalDistImob = spes.reduce((s, p) => s + p.totalDistributed, 0);

  const consolidado = [
    { "Ramo": "Incorporação", "Projetos": spes.length, "Investido (R$)": brl(totalImob), "Distribuído (R$)": brl(totalDistImob) },
    ...(hotel
      ? [{ "Ramo": "Hoteleiro", "Projetos": 1, "Investido (R$)": brl(hotel.totalInvested), "Distribuído (R$)": brl(hotel.totalDistributed) }]
      : []),
    {
      "Ramo": "TOTAL",
      "Projetos": spes.length + (hotel ? 1 : 0),
      "Investido (R$)": brl(totalImob + (hotel?.totalInvested ?? 0)),
      "Distribuído (R$)": brl(totalDistImob + (hotel?.totalDistributed ?? 0)),
    },
  ];
  const wsConsolidado = XLSX.utils.json_to_sheet(consolidado);
  XLSX.utils.book_append_sheet(wb, wsConsolidado, "Consolidado");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const today = new Date().toISOString().split("T")[0];
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="prizma-relatorio-${today}.xlsx"`,
    },
  });
}
