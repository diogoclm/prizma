"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { VarianceBadge } from "@/components/ui/VarianceBadge";
import { fmtPct, fmtMoic, fmtBrl, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import Link from "next/link";

interface SpeMetrics {
  projectId: string;
  name: string;
  stage: string;
  ownershipPct: number;
  realizedIrr: number | null;
  realizedMoic: number | null;
  totalInvested: number;
  totalDistributed: number;
  baselineIrr: number | null;
  baselineMoic: number | null;
  baselineLabel: string | null;
  currentIrr: number | null;
  currentIrrConverged: boolean;
  irrVariancePp: number | null;
}

export default function IncorporacaoPage() {
  const [data, setData] = useState<SpeMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/imobiliario")
      .then((r) => r.json())
      .then((d: SpeMetrics[]) => {
        // Landbanking tem visão própria em Terrenos — não aparece aqui
        setData(d.filter((p) => p.stage !== "LANDBANKING"));
        setLoading(false);
      });
  }, []);

  const totalInvested = data.reduce((s, p) => s + p.totalInvested, 0);
  const totalDistributed = data.reduce((s, p) => s + p.totalDistributed, 0);
  const totalProfit = totalDistributed - totalInvested;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-prizma-900">Incorporação — Carteira de SPEs</h1>
          <p className="text-prizma-400 text-sm mt-1">
            {data.length} projetos · TIR e variância vs. baseline congelado
          </p>
        </div>
        <Link
          href="/dashboard/terrenos"
          className="px-4 py-2 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-sm text-prizma-800 transition-colors"
        >
          Ver Terrenos →
        </Link>
      </div>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          {/* Totais consolidados */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <MetricCard label="Projetos" value={data.length} />
            <MetricCard label="Capital investido" value={fmtBrl(totalInvested)} />
            <MetricCard label="Valor retornado" value={fmtBrl(totalDistributed)} />
            <MetricCard
              label="Lucro"
              value={fmtBrl(totalProfit)}
              highlight={totalProfit >= 0 ? "positive" : "negative"}
            />
            <MetricCard
              label="MOIC médio"
              value={
                data.filter((p) => p.realizedMoic).length > 0
                  ? fmtMoic(
                      data.filter((p) => p.realizedMoic).reduce((s, p) => s + p.realizedMoic!, 0) /
                        data.filter((p) => p.realizedMoic).length
                    )
                  : null
              }
            />
          </div>

          {/* Tabela de projetos */}
          <div className="rounded-xl border border-prizma-300 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white text-prizma-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Projeto</th>
                  <th className="px-4 py-3 text-left">Estágio</th>
                  <th className="px-4 py-3 text-right">Investido</th>
                  <th className="px-4 py-3 text-right">Retornado</th>
                  <th className="px-4 py-3 text-right">Lucro</th>
                  <th className="px-4 py-3 text-right">TIR Baseline</th>
                  <th className="px-4 py-3 text-right">TIR Corrente</th>
                  <th className="px-4 py-3 text-right">MOIC</th>
                  <th className="px-4 py-3 text-center">vs. Baseline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prizma-200">
                {data.map((p) => (
                  <tr key={p.projectId} className="bg-prizma-50 hover:bg-white transition-colors">
                    <td className="px-4 py-3">
                      <a
                        href={`/dashboard/projetos/${p.projectId}`}
                        className="text-prizma-400 hover:text-prizma-300 font-medium"
                      >
                        {p.name}
                      </a>
                      {p.ownershipPct < 100 && (
                        <span className="text-prizma-400 text-xs ml-2">{p.ownershipPct}%</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          STAGE_COLORS[p.stage] ?? "text-prizma-400 bg-prizma-100"
                        }`}
                      >
                        {STAGE_LABELS[p.stage] ?? p.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-prizma-600">
                      {fmtBrl(p.totalInvested)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-prizma-600">
                      {fmtBrl(p.totalDistributed)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={p.totalDistributed - p.totalInvested >= 0 ? "text-positive" : "text-negative"}>
                        {fmtBrl(p.totalDistributed - p.totalInvested)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-prizma-700">
                      {fmtPct(p.baselineIrr)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={p.currentIrr !== null ? "text-positive" : "text-prizma-400"}>
                        {fmtPct(p.currentIrr)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-prizma-600">
                      {fmtMoic(p.realizedMoic)}
                    </td>
                    <td className="px-4 py-3 text-center">
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
