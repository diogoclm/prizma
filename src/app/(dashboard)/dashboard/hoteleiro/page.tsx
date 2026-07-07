"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { VarianceBadge } from "@/components/ui/VarianceBadge";
import { CashFlowForm } from "@/components/ui/CashFlowForm";
import { ValuationForm } from "@/components/ui/ValuationForm";
import { CashFlowRow } from "@/components/ui/CashFlowRow";
import { fmtPct, fmtMoic, fmtBrl, fmtDate } from "@/lib/format";

interface CashFlowEvent {
  id: string;
  date: string;
  amount: number;
  type: string;
  origin: string;
  description: string | null;
}

interface ValuationEntry {
  id: string;
  date: string;
  value: number;
  method: string | null;
  notes: string | null;
}

interface HoteleiroMetrics {
  projectId: string;
  name: string;
  ownershipPct: number;
  totalInvested: number;
  totalDistributed: number;
  latestValuationDate: string | null;
  latestValuationTotal: number | null;
  residualValue: number | null;
  irr: number | null;
  irrConverged: boolean;
  dpi: number;
  rvpi: number;
  tvpi: number;
  expectedIrr: number | null;
  expectedIrrConverged: boolean;
  baselineIrr: number | null;
  baselineMoic: number | null;
  baselineLabel: string | null;
  irrVariancePp: number | null;
}

export default function HoteleiroPage() {
  const [data, setData] = useState<HoteleiroMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCashForm, setShowCashForm] = useState(false);
  const [showValuationForm, setShowValuationForm] = useState(false);
  const [events, setEvents] = useState<CashFlowEvent[]>([]);
  const [valuations, setValuations] = useState<ValuationEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(() => {
    fetch("/api/hoteleiro")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setLoading(false);
          return;
        }
        setData(d);
        Promise.all([
          fetch(`/api/projects/${d.projectId}/cashflows`).then((r) => r.json()),
          fetch(`/api/projects/${d.projectId}/valuations`).then((r) => r.json()),
        ]).then(([e, v]) => {
          setEvents(e);
          setValuations(v);
          setLoading(false);
        });
      });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDeleteValuation(id: string) {
    if (!data) return;
    if (!confirm("Remover esta marcação?")) return;
    await fetch(`/api/projects/${data.projectId}/valuations/${id}`, { method: "DELETE" });
    loadData();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const allSelected = events.length > 0 && events.every((e) => prev.has(e.id));
      return allSelected ? new Set() : new Set(events.map((e) => e.id));
    });
  }

  async function handleBulkDelete() {
    if (!data) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} lançamento${ids.length > 1 ? "s" : ""} selecionado${ids.length > 1 ? "s" : ""}?`)) return;

    await fetch(`/api/projects/${data.projectId}/cashflows`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    setSelectedIds(new Set());
    loadData();
  }

  if (loading) return <div className="p-8 text-prizma-400">Carregando...</div>;
  if (error) return <div className="p-8 text-negative">{error}</div>;
  if (!data) return null;

  const irrHighlight = data.irr !== null
    ? data.irr > 0.1 ? "positive" : "negative"
    : "neutral";

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-prizma-900">{data.name}</h1>
          <p className="text-prizma-400 text-sm mt-1">
            Participação da Prizma: <strong className="text-prizma-800">{data.ownershipPct}%</strong>
            {data.baselineLabel && (
              <> · Baseline: <span className="text-prizma-700">{data.baselineLabel}</span></>
            )}
          </p>
        </div>
        {data.irrVariancePp !== null && (
          <div className="text-right">
            <p className="text-xs text-prizma-400 mb-1">vs. baseline</p>
            <VarianceBadge variancePp={data.irrVariancePp} />
          </div>
        )}
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="TIR atual (c/ valuation)"
          value={fmtPct(data.irr)}
          sub={data.irrConverged ? undefined : "não convergiu"}
          highlight={irrHighlight}
        />
        <MetricCard
          label="TIR esperada (c/ projeção)"
          value={fmtPct(data.expectedIrr)}
          highlight={data.expectedIrr !== null && data.expectedIrr > 0.1 ? "positive" : "neutral"}
        />
        <MetricCard
          label="TIR baseline"
          value={fmtPct(data.baselineIrr)}
        />
        <MetricCard
          label="MOIC baseline"
          value={fmtMoic(data.baselineMoic)}
        />
      </div>

      {/* Capital e distribuições */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Capital investido (Prizma)"
          value={fmtBrl(data.totalInvested)}
        />
        <MetricCard
          label="Distribuições recebidas"
          value={fmtBrl(data.totalDistributed)}
          highlight={data.totalDistributed > 0 ? "positive" : "neutral"}
        />
        <MetricCard
          label="Valor residual (Prizma)"
          value={fmtBrl(data.residualValue)}
          sub={data.latestValuationDate ? `Valuation: ${fmtDate(data.latestValuationDate)}` : "sem valuation"}
        />
        <MetricCard
          label="Valor total projeto"
          value={fmtBrl(data.latestValuationTotal)}
        />
      </div>

      {/* Múltiplos de fundo */}
      <div className="bg-white border border-prizma-300 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-prizma-600 mb-4">Múltiplos de fundo (base: capital Prizma)</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-prizma-400">DPI</p>
            <p className="text-xl font-bold text-prizma-900">{data.dpi.toFixed(2)}x</p>
            <p className="text-xs text-prizma-400">Distribuído / Investido</p>
          </div>
          <div>
            <p className="text-xs text-prizma-400">RVPI</p>
            <p className="text-xl font-bold text-prizma-900">{data.rvpi.toFixed(2)}x</p>
            <p className="text-xs text-prizma-400">Residual / Investido</p>
          </div>
          <div>
            <p className="text-xs text-prizma-400">TVPI</p>
            <p className={`text-xl font-bold ${data.tvpi >= 1 ? "text-positive" : "text-negative"}`}>
              {data.tvpi.toFixed(2)}x
            </p>
            <p className="text-xs text-prizma-400">Total / Investido</p>
          </div>
        </div>
      </div>

      <p className="mt-4 mb-6 text-xs text-prizma-500">
        Todos os valores refletem a participação de {data.ownershipPct}% da Prizma.
        O valor residual usa a marcação a mercado mais recente ({fmtDate(data.latestValuationDate)})
        como terminal value para o cálculo da TIR.
      </p>

      {/* Lançamentos diretos pelo painel */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => { setShowCashForm((v) => !v); setShowValuationForm(false); }}
          className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors"
        >
          {showCashForm ? "Cancelar" : "+ Lançar aporte/distribuição"}
        </button>
        <button
          onClick={() => { setShowValuationForm((v) => !v); setShowCashForm(false); }}
          className="px-3 py-1.5 bg-prizma-800 hover:bg-prizma-700 rounded-lg text-xs text-white transition-colors"
        >
          {showValuationForm ? "Cancelar" : "+ Nova marcação a mercado"}
        </button>
      </div>

      {showCashForm && (
        <div className="mb-6">
          <CashFlowForm
            projectId={data.projectId}
            onCreated={() => { setShowCashForm(false); setLoading(true); loadData(); }}
          />
        </div>
      )}

      {showValuationForm && (
        <div className="mb-6">
          <ValuationForm
            projectId={data.projectId}
            onCreated={() => { setShowValuationForm(false); setLoading(true); loadData(); }}
          />
        </div>
      )}

      {/* Tabela de lançamentos (editável) */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-prizma-600">Lançamentos ({events.length})</h2>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-white border border-negative text-negative hover:opacity-80 rounded-lg text-xs transition-colors"
          >
            Apagar selecionados ({selectedIds.size})
          </button>
        )}
      </div>
      <div className="rounded-xl border border-prizma-300 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-white text-prizma-400 text-xs">
            <tr>
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={events.length > 0 && events.every((e) => selectedIds.has(e.id))}
                  onChange={toggleSelectAll}
                  className="rounded border-prizma-300"
                />
              </th>
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
              <tr><td colSpan={7} className="px-4 py-6 text-center text-prizma-400">Nenhum lançamento ainda.</td></tr>
            )}
            {events.map((e) => (
              <CashFlowRow
                key={e.id}
                projectId={data.projectId}
                event={e}
                onChanged={loadData}
                selected={selectedIds.has(e.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabela de valuations */}
      <h2 className="text-sm font-semibold text-prizma-600 mb-2">Marcações a mercado ({valuations.length})</h2>
      <div className="rounded-xl border border-prizma-300 overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-white text-prizma-400 text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-right">Valor total projeto</th>
              <th className="px-4 py-2 text-right">Valor Prizma ({data.ownershipPct}%)</th>
              <th className="px-4 py-2 text-left">Método</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-prizma-200">
            {valuations.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-prizma-400">Nenhuma marcação ainda.</td></tr>
            )}
            {valuations.map((v) => (
              <tr key={v.id} className="bg-prizma-50 hover:bg-white">
                <td className="px-4 py-2 text-prizma-600">{fmtDate(v.date)}</td>
                <td className="px-4 py-2 text-right font-mono text-prizma-800">{fmtBrl(v.value)}</td>
                <td className="px-4 py-2 text-right font-mono text-prizma-700">
                  {fmtBrl(v.value * (data.ownershipPct / 100))}
                </td>
                <td className="px-4 py-2 text-prizma-400">{v.method ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDeleteValuation(v.id)}
                    className="text-negative hover:text-negative text-xs"
                  >
                    remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
