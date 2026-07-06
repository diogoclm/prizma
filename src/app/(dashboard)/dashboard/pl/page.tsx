"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { PLYearForm } from "@/components/ui/PLYearForm";
import { PLYearEditForm } from "@/components/ui/PLYearEditForm";
import { PLProjectForm } from "@/components/ui/PLProjectForm";
import { PLProjectRow } from "@/components/ui/PLProjectRow";
import { calcPLYearSummary } from "@/lib/pl/calc";
import { fmtBrl, fmtPct } from "@/lib/format";

interface PLProject {
  id: string;
  name: string;
  liquidCashGenPct: number;
  liquidCashGen: number;
  officeDiscount: number;
  phase: string | null;
  phasePct: number;
  notes: string | null;
}

interface PLYear {
  id: string;
  year: number;
  averageSalary: number;
  salaryMultiplier: number;
  amountPaid: number;
  evaluationScore: number | null;
  evaluationNotes: string | null;
  projects: PLProject[];
}

export default function PLPage() {
  const [years, setYears] = useState<PLYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showYearForm, setShowYearForm] = useState(false);
  const [editingYear, setEditingYear] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);

  const load = useCallback(() => {
    fetch("/api/pl/years")
      .then(async (r) => {
        if (!r.ok) {
          if (r.status === 401) {
            window.location.href = "/login";
            return;
          }
          throw new Error(`Erro ao carregar (${r.status})`);
        }
        const d: PLYear[] = await r.json();
        setYears(d);
        setLoading(false);
        setSelectedId((current) => current ?? (d.length > 0 ? d[0].id : null));
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  const selected = years.find((y) => y.id === selectedId) ?? null;
  const summary = selected ? calcPLYearSummary(selected) : null;

  async function handleDeleteYear() {
    if (!selected) return;
    if (!confirm(`Remover o ano ${selected.year} e todos os seus projetos?`)) return;
    await fetch(`/api/pl/years/${selected.id}`, { method: "DELETE" });
    setSelectedId(null);
    load();
  }

  return (
    <div className="p-8">
      <Link href="/dashboard" className="text-xs text-prizma-400 hover:text-prizma-600 mb-2 block">
        ← Voltar ao dashboard
      </Link>
      <h1 className="text-2xl font-bold text-prizma-900">Participação de Lucros (PL) — Executivo</h1>
      <p className="text-prizma-400 text-sm mt-1 mb-6">
        Histórico de pagamento de PL desde 2020, teto por salários e projetos/metas entregues por ano.
      </p>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          {years.length > 0 && (
            <div className="bg-white border border-prizma-300 rounded-xl p-5 mb-6">
              <p className="text-xs text-prizma-400 uppercase tracking-wide mb-3">Histórico de pagamentos</p>
              <div className="space-y-1">
                {[...years].sort((a, b) => a.year - b.year).map((y) => (
                  <div key={y.id} className="flex justify-between text-sm">
                    <span className="text-prizma-600">Ano {y.year}</span>
                    <span className="font-mono text-prizma-900">{fmtBrl(y.amountPaid)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {years.map((y) => (
              <button
                key={y.id}
                onClick={() => { setSelectedId(y.id); setEditingYear(false); setShowProjectForm(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedId === y.id
                    ? "bg-prizma-800 text-white"
                    : "bg-prizma-100 text-prizma-700 hover:bg-prizma-200"
                }`}
              >
                {y.year}
              </button>
            ))}
            <button
              onClick={() => setShowYearForm((v) => !v)}
              className="px-3 py-1.5 bg-white border border-prizma-300 hover:bg-prizma-100 rounded-lg text-sm text-prizma-800 transition-colors"
            >
              {showYearForm ? "Cancelar" : "+ Novo ano"}
            </button>
          </div>

          {showYearForm && (
            <div className="mb-6">
              <PLYearForm onCreated={() => { setShowYearForm(false); load(); }} />
            </div>
          )}

          {!selected && !showYearForm && (
            <p className="text-prizma-400">Nenhum ano cadastrado ainda.</p>
          )}

          {selected && summary && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-prizma-700">Ano {selected.year}</h2>
                <div>
                  <button
                    onClick={() => setEditingYear((v) => !v)}
                    className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors mr-2"
                  >
                    {editingYear ? "Cancelar edição" : "Editar ano"}
                  </button>
                  <button
                    onClick={handleDeleteYear}
                    className="px-3 py-1.5 bg-white border border-negative text-negative hover:opacity-80 rounded-lg text-xs transition-colors"
                  >
                    Remover ano
                  </button>
                </div>
              </div>

              {editingYear ? (
                <div className="mb-6">
                  <PLYearEditForm
                    yearId={selected.id}
                    averageSalary={selected.averageSalary}
                    salaryMultiplier={selected.salaryMultiplier}
                    amountPaid={selected.amountPaid}
                    evaluationScore={selected.evaluationScore}
                    evaluationNotes={selected.evaluationNotes}
                    onSaved={() => { setEditingYear(false); load(); }}
                    onCancel={() => setEditingYear(false)}
                  />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <MetricCard label="Salário médio" value={fmtBrl(selected.averageSalary)} />
                    <MetricCard label="Teto da PL" value={fmtBrl(summary.teto)} sub={`${selected.salaryMultiplier}x salário`} />
                    <MetricCard label="Valor pago" value={fmtBrl(summary.amountPaid)} highlight="positive" />
                    <MetricCard
                      label="% do teto"
                      value={summary.pctOfTeto !== null ? fmtPct(summary.pctOfTeto) : "—"}
                      highlight={summary.pctOfTeto !== null && summary.pctOfTeto > 1 ? "negative" : "neutral"}
                    />
                  </div>

                  <div className="bg-white border border-prizma-300 rounded-xl p-5 mb-6">
                    <p className="text-xs text-prizma-400 uppercase tracking-wide mb-2">Avaliação do ano</p>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-prizma-900">
                        {selected.evaluationScore !== null ? fmtPct(selected.evaluationScore) : "—"}
                      </span>
                      <p className="text-sm text-prizma-500">{selected.evaluationNotes ?? "Sem observações registradas."}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-prizma-400 uppercase tracking-wide">Projetos e metas entregues</p>
                <button
                  onClick={() => setShowProjectForm((v) => !v)}
                  className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors"
                >
                  {showProjectForm ? "Cancelar" : "+ Novo projeto"}
                </button>
              </div>

              {showProjectForm && (
                <div className="mb-4">
                  <PLProjectForm yearId={selected.id} onCreated={() => { setShowProjectForm(false); load(); }} />
                </div>
              )}

              <div className="rounded-xl border border-prizma-300 overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-prizma-100 text-prizma-400 text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Projeto</th>
                      <th className="px-4 py-2 text-left">Fase</th>
                      <th className="px-4 py-2 text-right">Geração Líq. de Caixa</th>
                      <th className="px-4 py-2 text-right">% GLC considerado</th>
                      <th className="px-4 py-2 text-right">Desconto escritório</th>
                      <th className="px-4 py-2 text-right">% da fase</th>
                      <th className="px-4 py-2 text-right">Base de cálculo</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-prizma-200">
                    {selected.projects.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-6 text-center text-prizma-400">Nenhum projeto lançado ainda.</td></tr>
                    )}
                    {selected.projects.map((p) => (
                      <PLProjectRow key={p.id} yearId={selected.id} project={p} onChanged={load} />
                    ))}
                  </tbody>
                  {selected.projects.length > 0 && (
                    <tfoot className="bg-prizma-50 font-semibold">
                      <tr>
                        <td className="px-4 py-2 text-prizma-700">Total</td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 text-right font-mono text-prizma-900">{fmtBrl(summary.totalLiquidCashGen)}</td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2 text-right font-mono text-prizma-900">{fmtBrl(summary.totalBaseCalculo)}</td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
