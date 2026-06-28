"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
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

  const totalImob = spes.reduce((s, p) => s + p.totalInvested, 0);
  const totalHotel = hotel?.totalInvested ?? 0;
  const totalTerrenos = terrenos.reduce((s, t) => s + t.totalInvested, 0);
  const totalGeral = totalImob + totalHotel + totalTerrenos;

  const totalDistImob = spes.reduce((s, p) => s + p.totalDistributed, 0);
  const totalDistHotel = hotel?.totalDistributed ?? 0;
  const totalProfit = totalDistImob + totalDistHotel - (totalImob + totalHotel);

  const terrenosMarketValue = terrenos.reduce(
    (s, t) => s + (t.latestValuationValue ?? t.baselineDeliveryValue ?? 0),
    0
  );

  const incorporacaoData = spes.filter((p) => p.stage !== "LANDBANKING");
  const incorporacaoInvested = incorporacaoData.reduce((s, p) => s + p.totalInvested, 0);
  const incorporacaoDistributed = incorporacaoData.reduce((s, p) => s + p.totalDistributed, 0);
  const incorporacaoProfit = incorporacaoDistributed - incorporacaoInvested;
  const incorporacaoMoicList = incorporacaoData.filter((p) => p.realizedMoic !== null);
  const incorporacaoMoicAvg = incorporacaoMoicList.length > 0
    ? incorporacaoMoicList.reduce((s, p) => s + (p.realizedMoic ?? 0), 0) / incorporacaoMoicList.length
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
          className="px-4 py-2 bg-prizma-600 hover:bg-prizma-700 rounded-lg text-sm text-white transition-colors"
        >
          Exportar XLSX
        </a>
      </div>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          {/* Cards consolidados */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Capital total investido" value={fmtBrl(totalGeral)} />
            <MetricCard
              label="Valor retornado"
              value={fmtBrl(totalDistImob + totalDistHotel)}
              highlight="positive"
            />
            <MetricCard
              label="Lucro"
              value={fmtBrl(totalProfit)}
              highlight={totalProfit >= 0 ? "positive" : "negative"}
            />
            <MetricCard label="Projetos imobiliários" value={spes.length} />
            <MetricCard label="Terrenos" value={terrenos.length} />
          </div>

          {/* Hoteleiro */}
          {hotel && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-prizma-700">Hoteleiro</h2>
                <Link href="/dashboard/hoteleiro" className="text-xs text-prizma-400 hover:underline">
                  Ver detalhes →
                </Link>
              </div>
              <div className="bg-hotel-bg border border-hotel-border border-l-4 border-l-hotel-accent rounded-xl p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
                <MetricCard label="Projeto" value={hotel.name} />
                <MetricCard label="Participação" value={`${hotel.ownershipPct}%`} />
                <MetricCard label="Investido (Prizma)" value={fmtBrl(hotel.totalInvested)} />
                <MetricCard
                  label="TIR atual"
                  value={fmtPct(hotel.irr)}
                  highlight={hotel.irr !== null && hotel.irr > 0.1 ? "positive" : "neutral"}
                />
                <MetricCard label="TVPI" value={`${hotel.tvpi.toFixed(2)}x`} />
              </div>
            </section>
          )}

          {/* Terrenos */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-prizma-600">Terrenos</h2>
              <Link href="/dashboard/terrenos" className="text-xs text-prizma-400 hover:underline">
                Ver detalhes →
              </Link>
            </div>
            <div className="bg-land-bg border border-land-border border-l-4 border-l-land-accent rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Terrenos cadastrados" value={terrenos.length} />
              <MetricCard label="Total investido" value={fmtBrl(totalTerrenos)} />
              <MetricCard
                label="Valor de mercado (real + esperado)"
                value={fmtBrl(terrenosMarketValue)}
                highlight={terrenosMarketValue >= totalTerrenos ? "positive" : "negative"}
              />
              <MetricCard
                label="TIR esperada média"
                value={
                  terrenos.filter((t) => t.baselineIrr !== null).length > 0
                    ? fmtPct(
                        terrenos.filter((t) => t.baselineIrr !== null).reduce((s, t) => s + (t.baselineIrr ?? 0), 0) /
                          terrenos.filter((t) => t.baselineIrr !== null).length
                      )
                    : null
                }
              />
            </div>
          </section>

          {/* Incorporação */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-prizma-700">Incorporação</h2>
              <Link href="/dashboard/incorporacao" className="text-xs text-prizma-400 hover:underline">
                Ver carteira →
              </Link>
            </div>

            <div className="bg-incorp-bg border border-incorp-border border-l-4 border-l-incorp-accent rounded-xl p-5">
              {/* Cards consolidados */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <MetricCard label="Projetos" value={incorporacaoData.length} />
                <MetricCard label="Capital investido" value={fmtBrl(incorporacaoInvested)} />
                <MetricCard label="Valor retornado" value={fmtBrl(incorporacaoDistributed)} />
                <MetricCard
                  label="Lucro"
                  value={fmtBrl(incorporacaoProfit)}
                  highlight={incorporacaoProfit >= 0 ? "positive" : "negative"}
                />
                <MetricCard label="MOIC médio" value={fmtMoic(incorporacaoMoicAvg)} />
              </div>

              {/* Funil por estágio */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {["LANCAMENTO", "CONSTRUCAO", "ENTREGUE", "ENCERRADO"].map((stage) => {
                  const count = spes.filter((p) => p.stage === stage).length;
                  return (
                    <div
                      key={stage}
                      className={`rounded-lg border p-3 text-center ${STAGE_COLORS[stage] ?? ""} border-prizma-300`}
                    >
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs mt-0.5 opacity-80">{STAGE_LABELS[stage]}</p>
                    </div>
                  );
                })}
              </div>

              {/* Lista resumida */}
              <div className="rounded-xl border border-incorp-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white text-prizma-400 text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Projeto</th>
                      <th className="px-4 py-2 text-left">Estágio</th>
                      <th className="px-4 py-2 text-right">Investido</th>
                      <th className="px-4 py-2 text-right">Lucro</th>
                      <th className="px-4 py-2 text-right">TIR Baseline</th>
                      <th className="px-4 py-2 text-right">TIR Corrente</th>
                      <th className="px-4 py-2 text-center">Variância</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-incorp-border">
                    {spes.filter((p) => p.stage !== "LANDBANKING").map((p) => (
                      <tr key={p.projectId} className="bg-white hover:bg-incorp-bg">
                        <td className="px-4 py-2">
                          <Link
                            href={`/dashboard/projetos/${p.projectId}`}
                            className="text-prizma-400 hover:text-prizma-300"
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
                        <td className="px-4 py-2 text-right font-mono text-prizma-700">
                          {fmtPct(p.baselineIrr)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-positive">
                          {fmtPct(p.currentIrr)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <VarianceBadge variancePp={p.irrVariancePp} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
