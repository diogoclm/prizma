"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/ui/MetricCard";
import { ShareholderTxForm } from "@/components/ui/ShareholderTxForm";
import { ShareholderTxRow } from "@/components/ui/ShareholderTxRow";
import { ShareholderImportForm } from "@/components/ui/ShareholderImportForm";
import { calcShareholderSummary } from "@/lib/societario/calc";
import { fmtBrl } from "@/lib/format";

interface Tx {
  id: string;
  date: string;
  amount: number;
  type: "APORTE" | "DIVIDENDO" | "ADMINISTRACAO";
  reason: string | null;
  source: string | null;
}

interface Shareholder {
  id: string;
  name: string;
  adminPct: number;
  transactions: Tx[];
}

export default function AcionistasPage() {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFormId, setOpenFormId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    fetch("/api/shareholders")
      .then((r) => r.json())
      .then((d) => { setShareholders(d); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(sh: Shareholder) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = sh.transactions.length > 0 && sh.transactions.every((tx) => next.has(tx.id));
      sh.transactions.forEach((tx) => {
        if (allSelected) next.delete(tx.id); else next.add(tx.id);
      });
      return next;
    });
  }

  async function handleBulkDelete(sh: Shareholder) {
    const ids = sh.transactions.map((tx) => tx.id).filter((id) => selectedIds.has(id));
    if (ids.length === 0) return;
    if (!confirm(`Remover ${ids.length} lançamento${ids.length > 1 ? "s" : ""} selecionado${ids.length > 1 ? "s" : ""}?`)) return;

    await fetch(`/api/shareholders/${sh.id}/transactions`, {
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

  const totalAportado = shareholders.reduce(
    (s, sh) => s + calcShareholderSummary(sh.transactions).totalAportado, 0
  );
  const totalDividendos = shareholders.reduce(
    (s, sh) => s + calcShareholderSummary(sh.transactions).totalDividendos, 0
  );

  return (
    <div className="p-8">
      <Link href="/dashboard" className="text-xs text-prizma-400 hover:text-prizma-600 mb-2 block">
        ← Voltar ao dashboard
      </Link>
      <h1 className="text-2xl font-bold text-prizma-900">Acionistas — Aportes & Dividendos</h1>
      <p className="text-prizma-400 text-sm mt-1 mb-6">
        Controle de capital aportado e dividendos pagos a cada acionista.
      </p>

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricCard label="Total aportado (todos)" value={fmtBrl(totalAportado)} />
            <MetricCard label="Total dividendos pagos" value={fmtBrl(totalDividendos)} highlight="positive" />
          </div>

          <div className="mb-8">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors mb-3"
            >
              {showImport ? "Ocultar importação" : "+ Importar planilha"}
            </button>
            {showImport && <ShareholderImportForm onImported={load} />}
          </div>

          <div className="space-y-8">
            {shareholders.map((sh) => {
              const summary = calcShareholderSummary(sh.transactions);
              const selectedCount = sh.transactions.filter((tx) => selectedIds.has(tx.id)).length;
              return (
                <section key={sh.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-prizma-700">{sh.name}</h2>
                    <div className="flex items-center gap-2">
                      {selectedCount > 0 && (
                        <button
                          onClick={() => handleBulkDelete(sh)}
                          className="px-3 py-1.5 bg-white border border-negative text-negative hover:opacity-80 rounded-lg text-xs transition-colors"
                        >
                          Apagar selecionados ({selectedCount})
                        </button>
                      )}
                      <button
                        onClick={() => setOpenFormId(openFormId === sh.id ? null : sh.id)}
                        className="px-3 py-1.5 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-xs text-prizma-800 transition-colors"
                      >
                        {openFormId === sh.id ? "Cancelar" : "+ Novo lançamento"}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-prizma-400 uppercase tracking-wide mb-2">Capital — Aporte / Dividendo</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <MetricCard label="Total aportado" value={fmtBrl(summary.totalAportado)} />
                    <MetricCard label="Dividendos recebidos" value={fmtBrl(summary.totalDividendos)} highlight="positive" />
                    <MetricCard
                      label="Saldo de capital"
                      value={fmtBrl(summary.saldoCapital)}
                      highlight={summary.saldoCapital >= 0 ? "positive" : "negative"}
                    />
                  </div>

                  <p className="text-xs text-prizma-400 uppercase tracking-wide mb-2">Administração (conta separada)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <MetricCard label="Total pago em administração" value={fmtBrl(summary.totalAdministracao)} />
                  </div>

                  {openFormId === sh.id && (
                    <div className="mb-4">
                      <ShareholderTxForm
                        shareholderId={sh.id}
                        onCreated={() => { setOpenFormId(null); load(); }}
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
                              checked={sh.transactions.length > 0 && sh.transactions.every((tx) => selectedIds.has(tx.id))}
                              onChange={() => toggleSelectAll(sh)}
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
                        {sh.transactions.length === 0 && (
                          <tr><td colSpan={7} className="px-4 py-6 text-center text-prizma-400">Nenhum lançamento ainda.</td></tr>
                        )}
                        {sh.transactions.map((tx) => (
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
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
