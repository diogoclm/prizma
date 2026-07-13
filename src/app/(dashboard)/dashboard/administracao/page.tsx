"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { ShareholderTxForm } from "@/components/ui/ShareholderTxForm";
import { ShareholderTxRow } from "@/components/ui/ShareholderTxRow";
import { calcShareholderSummary } from "@/lib/societario/calc";
import { fmtBrl } from "@/lib/format";

interface Tx {
  id: string;
  date: string;
  amount: number;
  type: "APORTE" | "DIVIDENDO" | "ADMINISTRACAO";
  reason: string | null;
  source: string | null;
  projectId: string | null;
}

interface Shareholder {
  id: string;
  name: string;
  adminPct: number;
  transactions: Tx[];
}

interface AdminByAdministrator {
  shareholderId: string;
  name: string;
  adminPct: number;
  expected: number;
  paid: number;
  balance: number;
}

interface AdminByProjectResult {
  projectId: string;
  projectName: string;
  lucro: number;
  lucroClamped: number;
  expectedTotal: number;
  paidTotal: number;
  balanceTotal: number;
  byAdministrator: AdminByAdministrator[];
  isManual: boolean;
  manualId: string | null;
  manualNotes: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

export default function AdministracaoPage() {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [balances, setBalances] = useState<AdminByProjectResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTxFormId, setOpenTxFormId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [editingPctId, setEditingPctId] = useState<string | null>(null);
  const [pctValue, setPctValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [allProjects, setAllProjects] = useState<ProjectOption[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualProjectId, setManualProjectId] = useState("");
  const [manualLucro, setManualLucro] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/shareholders").then((r) => r.json()),
      fetch("/api/admin-balance").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([sh, bal, projs]) => {
      setShareholders(sh);
      setBalances(bal);
      setAllProjects(projs);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function savePct(id: string) {
    await fetch(`/api/shareholders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPct: parseFloat(pctValue.replace(",", ".")) / 100 }),
    });
    setEditingPctId(null);
    load();
  }

  function openManualForm(entry?: AdminByProjectResult) {
    setManualProjectId(entry?.projectId ?? "");
    setManualLucro(entry ? String(entry.lucro) : "");
    setManualNotes(entry?.manualNotes ?? "");
    setManualError(null);
    setShowManualForm(true);
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualSaving(true);
    setManualError(null);

    const res = await fetch("/api/admin-balance/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: manualProjectId,
        lucro: parseFloat(manualLucro.replace(",", ".")) || 0,
        notes: manualNotes || undefined,
      }),
    });

    if (!res.ok) {
      setManualError("Erro ao salvar projeto manual");
      setManualSaving(false);
      return;
    }

    setShowManualForm(false);
    setManualSaving(false);
    load();
  }

  async function handleManualDelete(entry: AdminByProjectResult) {
    if (!entry.manualId) return;
    if (!confirm(`Remover "${entry.projectName}" do saldo de administração?`)) return;
    await fetch(`/api/admin-balance/manual/${entry.manualId}`, { method: "DELETE" });
    load();
  }

  // No seletor: projetos ainda fora da tabela (os automáticos já estão lá) —
  // mais o projeto em edição, para o select exibir o nome dele.
  const projectsInTable = new Set(balances.map((b) => b.projectId));
  const manualOptions = allProjects.filter(
    (p) => !projectsInTable.has(p.id) || p.id === manualProjectId
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(txs: Tx[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = txs.length > 0 && txs.every((tx) => next.has(tx.id));
      txs.forEach((tx) => {
        if (allSelected) next.delete(tx.id); else next.add(tx.id);
      });
      return next;
    });
  }

  async function handleBulkDelete(shareholderId: string, txs: Tx[]) {
    const ids = txs.map((tx) => tx.id).filter((id) => selectedIds.has(id));
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} pagamento${ids.length > 1 ? "s" : ""} selecionado${ids.length > 1 ? "s" : ""}?`)) return;

    await fetch(`/api/shareholders/${shareholderId}/transactions`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    load();
  }

  const totalExpected = balances.reduce((s, b) => s + b.expectedTotal, 0);
  const totalPaid = balances.reduce((s, b) => s + b.paidTotal, 0);
  const totalBalance = totalExpected - totalPaid;

  const balanceByAdministrator = balances
    .flatMap((b) => b.byAdministrator)
    .reduce<Record<string, { name: string; balance: number }>>((acc, a) => {
      acc[a.shareholderId] = {
        name: a.name,
        balance: (acc[a.shareholderId]?.balance ?? 0) + a.balance,
      };
      return acc;
    }, {});

  const projectOptions = balances.map((b) => ({ projectId: b.projectId, projectName: b.projectName }));

  return (
    <div className="p-8">
      <Link href="/dashboard" className="text-xs text-prizma-400 hover:text-prizma-600 mb-2 block">
        ← Voltar ao dashboard
      </Link>
      <h1 className="text-2xl font-bold text-prizma-900">Administração</h1>
      <p className="text-prizma-400 text-sm mt-1 mb-6">
        Saldo a receber de administração por projeto (cálculo automático) e pagamentos aos acionistas.
      </p>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <MetricCard label="Esperado (projetos entregues)" value={fmtBrl(totalExpected)} />
            <MetricCard label="Pago aos acionistas" value={fmtBrl(totalPaid)} highlight="positive" />
            <MetricCard
              label="Saldo a receber"
              value={fmtBrl(totalBalance)}
              highlight={totalBalance > 0 ? "negative" : "positive"}
            >
              <p className="text-xs text-prizma-400 mt-2 pt-2 border-t border-prizma-100">
                {Object.values(balanceByAdministrator).map((a, i) => (
                  <span key={a.name}>
                    {i > 0 && " · "}
                    {a.name}:{" "}
                    <span className={a.balance > 0 ? "text-negative" : "text-positive"}>{fmtBrl(a.balance)}</span>
                  </span>
                ))}
              </p>
            </MetricCard>
          </div>

          {/* % de administração por acionista (referência) */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-prizma-700 mb-3">% de Administração (referência)</h2>
            <div className="grid grid-cols-3 gap-4">
              {shareholders.map((sh) => (
                <div key={sh.id} className="bg-white border border-prizma-300 rounded-lg p-4 text-center">
                  <p className="text-xs text-prizma-400 uppercase tracking-wide">{sh.name}</p>
                  {editingPctId === sh.id ? (
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={pctValue}
                        onChange={(e) => setPctValue(e.target.value)}
                        className="w-20 bg-white border border-prizma-300 rounded px-2 py-1 text-sm text-prizma-900 text-center"
                        autoFocus
                      />
                      <span className="text-prizma-500 text-sm">%</span>
                      <button onClick={() => savePct(sh.id)} className="text-positive text-xs">salvar</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingPctId(sh.id); setPctValue(String((sh.adminPct * 100).toFixed(1))); }}
                      className="text-2xl font-bold text-prizma-900 mt-1 hover:opacity-70"
                    >
                      {(sh.adminPct * 100).toFixed(0)}%
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Saldo de administração por projeto (automático + manual) */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-prizma-700">Saldo por Projeto</h2>
              <button
                onClick={() => (showManualForm ? setShowManualForm(false) : openManualForm())}
                className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors"
              >
                {showManualForm ? "Cancelar" : "+ Adicionar projeto"}
              </button>
            </div>
            <p className="text-xs text-prizma-400 mb-3">
              Incorporação entregue/encerrada entra automaticamente. Outros projetos (ex: hoteleiro)
              podem ser adicionados manualmente informando o lucro. Lucro negativo zera a administração esperada.
            </p>

            {showManualForm && (
              <form onSubmit={handleManualSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4 mb-4">
                <h3 className="text-sm font-semibold text-prizma-600">Projeto manual no saldo de administração</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-prizma-400 mb-1">Projeto</label>
                    <select
                      value={manualProjectId}
                      onChange={(e) => setManualProjectId(e.target.value)}
                      required
                      className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
                    >
                      <option value="">Selecione...</option>
                      {manualOptions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-prizma-400 mb-1">Lucro (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualLucro}
                      onChange={(e) => setManualLucro(e.target.value)}
                      required
                      placeholder="0,00"
                      className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-prizma-400 mb-1">Observações</label>
                    <input
                      type="text"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="Opcional"
                      className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
                    />
                  </div>
                </div>
                {manualError && <p className="text-negative text-xs">{manualError}</p>}
                <button
                  type="submit"
                  disabled={manualSaving}
                  className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
                >
                  {manualSaving ? "Salvando..." : "Salvar"}
                </button>
              </form>
            )}

            <div className="rounded-xl border border-prizma-300 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-prizma-100 text-prizma-400 text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">Projeto</th>
                    <th className="px-4 py-2 text-right">Lucro</th>
                    <th className="px-4 py-2 text-right">Esperado</th>
                    <th className="px-4 py-2 text-right">Pago</th>
                    <th className="px-4 py-2 text-right">Saldo</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-prizma-200">
                  {balances.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-6 text-center text-prizma-400">Nenhum projeto no saldo ainda — entregue um projeto de incorporação ou adicione manualmente.</td></tr>
                  )}
                  {balances.map((b) => (
                    <Fragment key={b.projectId}>
                      <tr className="bg-white hover:bg-prizma-50">
                        <td className="px-4 py-2 text-prizma-900">
                          {b.projectName}
                          {b.isManual && (
                            <span
                              className="ml-2 px-1.5 py-0.5 rounded bg-prizma-100 text-prizma-500 text-[10px] uppercase tracking-wide"
                              title={b.manualNotes ?? undefined}
                            >
                              manual
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          <span className={b.lucro >= 0 ? "text-positive" : "text-negative"}>{fmtBrl(b.lucro)}</span>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-prizma-600">{fmtBrl(b.expectedTotal)}</td>
                        <td className="px-4 py-2 text-right font-mono text-positive">{fmtBrl(b.paidTotal)}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          <span className={b.balanceTotal > 0 ? "text-negative" : "text-positive"}>{fmtBrl(b.balanceTotal)}</span>
                        </td>
                        <td className="px-4 py-2 text-right whitespace-nowrap">
                          <button
                            onClick={() => setExpandedProjectId(expandedProjectId === b.projectId ? null : b.projectId)}
                            className="text-prizma-600 hover:text-prizma-900 text-xs"
                          >
                            {expandedProjectId === b.projectId ? "ocultar" : "detalhar"}
                          </button>
                          {b.isManual && (
                            <>
                              <button
                                onClick={() => openManualForm(b)}
                                className="text-prizma-600 hover:text-prizma-900 text-xs ml-3"
                              >
                                editar
                              </button>
                              <button
                                onClick={() => handleManualDelete(b)}
                                className="text-negative hover:opacity-80 text-xs ml-3"
                              >
                                remover
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      {expandedProjectId === b.projectId && (
                        <tr className="bg-prizma-50">
                          <td colSpan={6} className="px-4 py-3">
                            <table className="w-full text-xs">
                              <thead className="text-prizma-400">
                                <tr>
                                  <th className="text-left py-1">Administrador</th>
                                  <th className="text-right py-1">%</th>
                                  <th className="text-right py-1">Esperado</th>
                                  <th className="text-right py-1">Pago</th>
                                  <th className="text-right py-1">Saldo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {b.byAdministrator.map((a) => (
                                  <tr key={a.shareholderId} className="border-t border-prizma-200">
                                    <td className="py-1 text-prizma-800">{a.name}</td>
                                    <td className="py-1 text-right text-prizma-500">{(a.adminPct * 100).toFixed(0)}%</td>
                                    <td className="py-1 text-right font-mono text-prizma-600">{fmtBrl(a.expected)}</td>
                                    <td className="py-1 text-right font-mono text-positive">{fmtBrl(a.paid)}</td>
                                    <td className="py-1 text-right font-mono">
                                      <span className={a.balance > 0 ? "text-negative" : "text-positive"}>{fmtBrl(a.balance)}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Histórico de pagamentos de administração aos acionistas */}
          <section>
            <h2 className="text-lg font-semibold text-prizma-700 mb-3">Pagamentos aos Acionistas</h2>
            <div className="space-y-6">
              {shareholders.map((sh) => {
                const adminTxs = sh.transactions.filter((t) => t.type === "ADMINISTRACAO");
                const total = adminTxs.reduce((s, t) => s + t.amount, 0);
                const selectedCount = adminTxs.filter((tx) => selectedIds.has(tx.id)).length;
                return (
                  <div key={sh.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-prizma-600">
                        {sh.name} <span className="text-prizma-400">— {fmtBrl(total)}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <button
                            onClick={() => handleBulkDelete(sh.id, adminTxs)}
                            className="px-3 py-1 bg-white border border-negative text-negative hover:opacity-80 rounded text-xs"
                          >
                            Apagar selecionados ({selectedCount})
                          </button>
                        )}
                        <button
                          onClick={() => setOpenTxFormId(openTxFormId === sh.id ? null : sh.id)}
                          className="px-3 py-1 bg-prizma-100 hover:bg-prizma-200 rounded text-xs text-prizma-800"
                        >
                          {openTxFormId === sh.id ? "Cancelar" : "+ Pagamento"}
                        </button>
                      </div>
                    </div>

                    {openTxFormId === sh.id && (
                      <div className="mb-3">
                        <ShareholderTxForm
                          shareholderId={sh.id}
                          defaultType="ADMINISTRACAO"
                          lockType
                          projectOptions={projectOptions}
                          onCreated={() => { setOpenTxFormId(null); load(); }}
                        />
                      </div>
                    )}

                    <div className="rounded-xl border border-prizma-300 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-prizma-100 text-prizma-400 text-xs">
                          <tr>
                            <th className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={adminTxs.length > 0 && adminTxs.every((tx) => selectedIds.has(tx.id))}
                                onChange={() => toggleSelectAll(adminTxs)}
                                className="rounded border-prizma-300"
                              />
                            </th>
                            <th className="px-4 py-2 text-left">Data</th>
                            <th className="px-4 py-2 text-left">Tipo</th>
                            <th className="px-4 py-2 text-right">Valor</th>
                            <th className="px-4 py-2 text-left">Motivo</th>
                            <th className="px-4 py-2 text-left">Origem</th>
                            <th className="px-4 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-prizma-200">
                          {adminTxs.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-4 text-center text-prizma-400 text-xs">Nenhum pagamento ainda.</td></tr>
                          )}
                          {adminTxs.map((tx) => (
                            <ShareholderTxRow
                              key={tx.id}
                              shareholderId={sh.id}
                              tx={tx}
                              onChanged={load}
                              selected={selectedIds.has(tx.id)}
                              onToggleSelect={toggleSelect}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
