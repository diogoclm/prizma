"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MetricCard } from "@/components/ui/MetricCard";
import { VarianceBadge } from "@/components/ui/VarianceBadge";
import { CashFlowForm } from "@/components/ui/CashFlowForm";
import { CashFlowRow } from "@/components/ui/CashFlowRow";
import { BaselineForm } from "@/components/ui/BaselineForm";
import { BaselineList } from "@/components/ui/BaselineList";
import { fmtPct, fmtMoic, fmtBrl, fmtDate, STAGE_LABELS, STAGE_COLORS } from "@/lib/format";
import Link from "next/link";

type Metrics = Record<string, unknown>;

interface CashFlowEvent {
  id: string;
  date: string;
  amount: number;
  type: string;
  origin: string;
  description: string | null;
}

interface Baseline {
  id: string;
  version: number;
  label: string;
  frozenAt: string;
  isFrozen: boolean;
  projectedIrr: number | null;
  projectedMoic: number | null;
}

export default function ProjetoPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [events, setEvents] = useState<CashFlowEvent[]>([]);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBaselineForm, setShowBaselineForm] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  const loadAll = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      fetch(`/api/projects/${projectId}/metrics`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/cashflows`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/baselines`).then((r) => r.json()),
    ]).then(([m, e, b]) => {
      setMetrics(m);
      setEvents(e);
      setBaselines(b);
      setLoading(false);
    });
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleStageChange(newStage: string) {
    setSavingStage(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    setSavingStage(false);
    loadAll();
  }

  if (loading) return <div className="p-8 text-prizma-400">Carregando...</div>;
  if (!metrics) return <div className="p-8 text-negative">Projeto não encontrado</div>;

  const isHoteleiro = "tvpi" in metrics;
  const stage = metrics.stage as string | undefined;

  return (
    <div className="p-8 max-w-5xl">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-xs text-prizma-400 hover:text-prizma-600 mb-2 block">
            ← Voltar ao dashboard
          </Link>
          <h1 className="text-2xl font-bold text-prizma-900">{metrics.name as string}</h1>
          <div className="flex items-center gap-3 mt-2">
            {stage && !isHoteleiro && (
              <select
                value={stage}
                disabled={savingStage}
                onChange={(e) => handleStageChange(e.target.value)}
                className={`px-2 py-0.5 rounded text-xs border-0 cursor-pointer disabled:opacity-50 ${STAGE_COLORS[stage] ?? ""}`}
              >
                {Object.entries(STAGE_LABELS)
                  .filter(([key]) => key !== "OPERACAO_CONTINUA")
                  .map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            )}
            {stage && isHoteleiro && (
              <span className={`px-2 py-0.5 rounded text-xs ${STAGE_COLORS[stage] ?? ""}`}>
                {STAGE_LABELS[stage] ?? stage}
              </span>
            )}
            {!isHoteleiro && (
              <span className="text-xs text-prizma-400">
                Ownership: {metrics.ownershipPct as number}%
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-prizma-400 mb-1">vs. baseline</p>
          <VarianceBadge variancePp={metrics.irrVariancePp as number | null} />
        </div>
      </div>

      {/* Métricas — imobiliário */}
      {!isHoteleiro && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard label="TIR corrente" value={fmtPct(metrics.currentIrr as number | null)}
              highlight={(metrics.currentIrr as number) > 0.15 ? "positive" : "neutral"} />
            <MetricCard label="TIR baseline" value={fmtPct(metrics.baselineIrr as number | null)} />
            <MetricCard label="TIR realizada" value={fmtPct(metrics.realizedIrr as number | null)}
              sub={metrics.baselineLabel as string | undefined} />
            <MetricCard label="MOIC realizado" value={fmtMoic(metrics.realizedMoic as number | null)} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricCard label="Total investido" value={fmtBrl(metrics.totalInvested as number)} />
            <MetricCard label="Total distribuído" value={fmtBrl(metrics.totalDistributed as number)}
              highlight={(metrics.totalDistributed as number) > 0 ? "positive" : "neutral"} />
          </div>
        </>
      )}

      {/* Métricas — hoteleiro */}
      {isHoteleiro && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard label="TIR atual" value={fmtPct(metrics.irr as number | null)}
              highlight={(metrics.irr as number) > 0.1 ? "positive" : "neutral"} />
            <MetricCard label="TIR esperada" value={fmtPct(metrics.expectedIrr as number | null)} />
            <MetricCard label="TIR baseline" value={fmtPct(metrics.baselineIrr as number | null)} />
            <MetricCard label="TVPI" value={`${(metrics.tvpi as number).toFixed(2)}x`} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard label="DPI" value={`${(metrics.dpi as number).toFixed(2)}x`} />
            <MetricCard label="RVPI" value={`${(metrics.rvpi as number).toFixed(2)}x`} />
            <MetricCard label="Valor residual (Prizma)" value={fmtBrl(metrics.residualValue as number | null)}
              sub={`Valuation: ${fmtDate(metrics.latestValuationDate as string | null)}`} />
            <MetricCard label="Investido (Prizma)" value={fmtBrl(metrics.totalInvested as number)} />
          </div>
        </>
      )}

      {/* Lançamento direto pelo painel */}
      <div className="mt-6 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-prizma-600">Lançamentos ({events.length})</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors"
        >
          {showForm ? "Cancelar" : "+ Novo lançamento"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4">
          <CashFlowForm
            projectId={projectId}
            onCreated={() => { setShowForm(false); loadAll(); }}
          />
        </div>
      )}

      {/* Tabela de lançamentos */}
      <div className="rounded-xl border border-prizma-300 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-white text-prizma-400 text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-right">Valor</th>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Origem</th>
              <th className="px-4 py-2 text-left">Descrição</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-prizma-200">
            {events.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-prizma-400">Nenhum lançamento ainda.</td></tr>
            )}
            {events.map((e) => (
              <CashFlowRow key={e.id} projectId={projectId} event={e} onChanged={loadAll} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Marcos (baseline) */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-prizma-600">Marcos / Baseline</h2>
        <button
          onClick={() => setShowBaselineForm((v) => !v)}
          className="px-3 py-1.5 bg-prizma-800 hover:bg-prizma-900 rounded-lg text-xs text-white transition-colors"
        >
          {showBaselineForm ? "Cancelar" : "+ Novo marco"}
        </button>
      </div>

      {showBaselineForm && (
        <div className="mb-4">
          <BaselineForm
            projectId={projectId}
            onCreated={() => { setShowBaselineForm(false); loadAll(); }}
          />
        </div>
      )}

      <div className="mb-6">
        <BaselineList baselines={baselines} projectId={projectId} onChanged={loadAll} />
      </div>

      {/* Links rápidos */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/importar`}
          className="px-4 py-2 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-sm text-prizma-600 transition-colors"
        >
          Importar planilha (carga inicial)
        </Link>
      </div>
    </div>
  );
}
