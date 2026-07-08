"use client";

import { useEffect, useState } from "react";
import { VarianceBadge } from "@/components/ui/VarianceBadge";
import { fmtPct, fmtBrl, fmtMoic, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import Link from "next/link";

interface SpeMetrics {
  projectId: string;
  name: string;
  stage: string;
  totalInvested: number;
  totalDistributed: number;
  realizedMoic: number | null;
  currentIrr: number | null;
  baselineIrr: number | null;
  irrVariancePp: number | null;
}

interface HoteleiroMetrics {
  name: string;
  ownershipPct: number;
  totalInvested: number;
  totalDistributed: number;
  irr: number | null;
  tvpi: number;
  irrVariancePp: number | null;
}

interface LandbankItem {
  projectId: string;
  name: string;
  totalInvested: number;
  latestValuationValue: number | null;
  baselineDeliveryValue: number | null;
  baselineIrr: number | null;
}

/** Card de KPI consolidado — compacto, alinhado à esquerda. */
function KpiCard({ label, value, tone, sub, children }: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
  sub?: string;
  children?: React.ReactNode;
}) {
  const toneClass = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-prizma-900";
  return (
    <div className="bg-white border border-prizma-300 rounded-xl p-4 min-w-0">
      <p className="text-[11px] text-prizma-400 uppercase tracking-wide font-semibold truncate">{label}</p>
      <p className={`text-xl font-bold mt-1 whitespace-nowrap ${toneClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-prizma-400 mt-0.5 truncate">{sub}</p>}
      {children}
    </div>
  );
}

/** Mini-estatística dentro dos cards de categoria. */
function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-prizma-900";
  return (
    <div>
      <p className="text-[10px] text-prizma-400">{label}</p>
      <p className={`text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [spes, setSpes] = useState<SpeMetrics[]>([]);
  const [hotel, setHotel] = useState<HoteleiroMetrics | null>(null);
  const [terrenos, setTerrenos] = useState<LandbankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/imobiliario").then((r) => r.json()),
      fetch("/api/hoteleiro").then((r) => r.json()),
      fetch("/api/imobiliario/landbanking").then((r) => r.json()),
    ]).then(([spesData, hotelData, landData]) => {
      setSpes(spesData);
      if (!hotelData.error) setHotel(hotelData);
      setTerrenos(landData);
      setLoading(false);
    });
  }, []);

  // /api/imobiliario retorna todos os projetos IMOBILIARIO, inclusive LANDBANKING —
  // terrenos são contabilizados separadamente (seção Terrenos), então precisam ser
  // excluídos daqui para não somar duas vezes no capital total investido.
  const spesSemTerreno = spes.filter((p) => p.stage !== "LANDBANKING");

  const totalImob = spesSemTerreno.reduce((s, p) => s + p.totalInvested, 0);
  const totalHotel = hotel?.totalInvested ?? 0;
  const totalTerrenos = terrenos.reduce((s, t) => s + t.totalInvested, 0);
  const totalGeral = totalImob + totalHotel + totalTerrenos;

  const totalDistImob = spesSemTerreno.reduce((s, p) => s + p.totalDistributed, 0);
  const totalDistHotel = hotel?.totalDistributed ?? 0;
  const totalProfit = totalDistImob + totalDistHotel - (totalImob + totalHotel);

  const terrenosMarketValue = terrenos.reduce(
    (s, t) => s + (t.latestValuationValue ?? t.baselineDeliveryValue ?? 0),
    0
  );
  const terrenosIrrList = terrenos.filter((t) => t.baselineIrr !== null);
  const terrenosIrrAvg = terrenosIrrList.length > 0
    ? terrenosIrrList.reduce((s, t) => s + (t.baselineIrr ?? 0), 0) / terrenosIrrList.length
    : null;

  const incorporacaoProfit = totalDistImob - totalImob;
  const incorporacaoMoicList = spesSemTerreno.filter((p) => p.realizedMoic !== null);
  const incorporacaoMoicAvg = incorporacaoMoicList.length > 0
    ? incorporacaoMoicList.reduce((s, p) => s + (p.realizedMoic ?? 0), 0) / incorporacaoMoicList.length
    : null;

  const irrList = spesSemTerreno.filter((p) => p.currentIrr !== null);
  const irrAvg = irrList.length > 0
    ? irrList.reduce((s, p) => s + (p.currentIrr ?? 0), 0) / irrList.length
    : null;
  const varianceList = spesSemTerreno.filter((p) => p.irrVariancePp !== null);
  const varianceAvg = varianceList.length > 0
    ? varianceList.reduce((s, p) => s + (p.irrVariancePp ?? 0), 0) / varianceList.length
    : null;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-prizma-900">Visão Geral — Prizma</h1>
          <p className="text-prizma-400 text-sm mt-1">Consolidado de todos os projetos</p>
        </div>
        <a
          href="/api/relatorios"
          download
          className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 rounded-lg text-sm text-white transition-colors"
        >
          Exportar XLSX
        </a>
      </div>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          {/* KPIs consolidados */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Capital investido" value={fmtBrl(totalGeral)} />
            <KpiCard label="Valor retornado" value={fmtBrl(totalDistImob + totalDistHotel)} tone="positive" />
            <KpiCard
              label="Lucro realizado"
              value={fmtBrl(totalProfit)}
              tone={totalProfit >= 0 ? "positive" : "negative"}
            />
            <KpiCard label="TIR média (incorp.)" value={fmtPct(irrAvg)}>
              {varianceAvg !== null && (
                <div className="mt-1"><VarianceBadge variancePp={varianceAvg} /></div>
              )}
            </KpiCard>
          </div>

          {/* Cards por categoria */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Hoteleiro */}
            <div className="bg-white border border-prizma-300 border-l-4 border-l-hotel-accent rounded-xl p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-hotel-accent">Hoteleiro</p>
                <Link href="/dashboard/hoteleiro" className="text-[11px] text-prizma-400 hover:text-prizma-600">
                  Detalhes →
                </Link>
              </div>
              {hotel ? (
                <>
                  <p className="text-xl font-bold text-prizma-900 mt-2">{fmtBrl(hotel.totalInvested)}</p>
                  <p className="text-[11px] text-prizma-400 mt-0.5">
                    investido · participação {hotel.ownershipPct}%
                  </p>
                  <div className="flex gap-5 mt-3">
                    <MiniStat label="TIR atual" value={fmtPct(hotel.irr)} />
                    <MiniStat label="TVPI" value={`${hotel.tvpi.toFixed(2)}x`} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-prizma-400 mt-2">Sem projeto hoteleiro.</p>
              )}
            </div>

            {/* Terrenos */}
            <div className="bg-white border border-prizma-300 border-l-4 border-l-land-accent rounded-xl p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-land-accent">Terrenos</p>
                <Link href="/dashboard/terrenos" className="text-[11px] text-prizma-400 hover:text-prizma-600">
                  Detalhes →
                </Link>
              </div>
              <p className="text-xl font-bold text-prizma-900 mt-2">{fmtBrl(totalTerrenos)}</p>
              <p className="text-[11px] text-prizma-400 mt-0.5">
                {terrenos.length} terreno{terrenos.length !== 1 ? "s" : ""} cadastrado{terrenos.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-5 mt-3">
                <MiniStat
                  label="Valor mercado"
                  value={fmtBrl(terrenosMarketValue)}
                  tone={terrenosMarketValue >= totalTerrenos ? "positive" : "negative"}
                />
                <MiniStat label="TIR esperada" value={fmtPct(terrenosIrrAvg)} />
              </div>
            </div>

            {/* Incorporação */}
            <div className="bg-white border border-prizma-300 border-l-4 border-l-incorp-accent rounded-xl p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-incorp-accent">Incorporação</p>
                <Link href="/dashboard/incorporacao" className="text-[11px] text-prizma-400 hover:text-prizma-600">
                  Carteira →
                </Link>
              </div>
              <p className="text-xl font-bold text-prizma-900 mt-2">{fmtBrl(totalImob)}</p>
              <p className="text-[11px] text-prizma-400 mt-0.5">
                {spesSemTerreno.length} projeto{spesSemTerreno.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-5 mt-3">
                <MiniStat label="MOIC médio" value={fmtMoic(incorporacaoMoicAvg)} />
                <MiniStat
                  label="Lucro"
                  value={fmtBrl(incorporacaoProfit)}
                  tone={incorporacaoProfit >= 0 ? "positive" : "negative"}
                />
              </div>
            </div>
          </div>

          {/* Carteira de incorporação */}
          <p className="text-[11px] text-prizma-400 uppercase tracking-wide font-semibold mb-2">
            Incorporação — carteira
          </p>
          <div className="rounded-xl border border-prizma-300 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white text-prizma-400 text-xs">
                <tr>
                  <th className="px-4 py-2 text-left">Projeto</th>
                  <th className="px-4 py-2 text-left">Estágio</th>
                  <th className="px-4 py-2 text-right">Investido</th>
                  <th className="px-4 py-2 text-right">Lucro</th>
                  <th className="px-4 py-2 text-left">TIR (baseline → corrente)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prizma-200">
                {spesSemTerreno.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-prizma-400">
                      Nenhum projeto de incorporação ainda.
                    </td>
                  </tr>
                )}
                {spesSemTerreno.map((p) => (
                  <tr key={p.projectId} className="bg-white hover:bg-prizma-50">
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/projetos/${p.projectId}`}
                        className="text-prizma-800 font-medium hover:text-prizma-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${STAGE_COLORS[p.stage] ?? ""}`}>
                        {STAGE_LABELS[p.stage] ?? p.stage}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-prizma-600">
                      {fmtBrl(p.totalInvested)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      <span className={p.totalDistributed - p.totalInvested >= 0 ? "text-positive" : "text-negative"}>
                        {fmtBrl(p.totalDistributed - p.totalInvested)}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="font-mono text-prizma-500">{fmtPct(p.baselineIrr)}</span>
                      <span className="text-prizma-400 mx-1">→</span>
                      <span className="font-mono font-semibold text-prizma-900 mr-2">{fmtPct(p.currentIrr)}</span>
                      <VarianceBadge variancePp={p.irrVariancePp} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
