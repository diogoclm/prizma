"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fmtBrl, fmtDate, fmtPct } from "@/lib/format";
import { TerrenoBaselineForm } from "@/components/ui/TerrenoBaselineForm";
import { TerrenoPurchaseForm } from "@/components/ui/TerrenoPurchaseForm";
import type { LandbankItem } from "@/app/api/imobiliario/landbanking/route";

export default function TerrenosPage() {
  const [items, setItems] = useState<LandbankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBaselineId, setEditingBaselineId] = useState<string | null>(null);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    fetch("/api/imobiliario/landbanking")
      .then((r) => r.json())
      .then((d) => { setItems(d); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        branch: "IMOBILIARIO",
        stage: "LANDBANKING",
        ownershipPct: 100,
      }),
    });
    setCreating(false);
    setShowNewForm(false);
    setNewName("");
    load();
  }

  async function handleDelete(projectId: string, name: string) {
    if (!confirm(`Remover "${name}"? Apaga todos os lançamentos, valuations e marcos desse terreno.`)) return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    load();
  }

  const totalInvested = items.reduce((s, i) => s + i.totalInvested, 0);
  const marketValueOf = (i: LandbankItem) => i.latestValuationValue ?? i.baselineDeliveryValue ?? null;
  const totalMarketValue = items.reduce((s, i) => s + (marketValueOf(i) ?? 0), 0);

  return (
    <div className="p-8">
      <Link href="/dashboard/incorporacao" className="text-xs text-prizma-400 hover:text-prizma-600 mb-2 block">
        ← Voltar à Incorporação
      </Link>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-prizma-900">Terrenos — Acompanhamento</h1>
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="px-3 py-1.5 bg-prizma-600 hover:bg-prizma-700 rounded-lg text-xs text-white transition-colors"
        >
          {showNewForm ? "Cancelar" : "+ Novo terreno"}
        </button>
      </div>
      <p className="text-prizma-400 text-sm mt-1 mb-6">
        {items.length} terrenos · investido vs. valor de mercado (real ou esperado pelo marco).
      </p>

      {showNewForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-white border border-prizma-300 rounded-xl p-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-prizma-400 mb-1">Nome do terreno</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              placeholder="Ex: Terreno Iota — Zona Sul"
              className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-positive hover:opacity-90 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-prizma-400">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-prizma-300 rounded-xl p-4">
              <p className="text-xs text-prizma-400">Total investido</p>
              <p className="text-xl font-bold text-prizma-900">{fmtBrl(totalInvested)}</p>
            </div>
            <div className="bg-white border border-prizma-300 rounded-xl p-4">
              <p className="text-xs text-prizma-400">Valor de mercado total (real + esperado)</p>
              <p className="text-xl font-bold text-positive">{fmtBrl(totalMarketValue)}</p>
            </div>
            <div className="bg-white border border-prizma-300 rounded-xl p-4">
              <p className="text-xs text-prizma-400">Terrenos</p>
              <p className="text-xl font-bold text-prizma-900">{items.length}</p>
            </div>
          </div>

          <div className="rounded-xl border border-prizma-300 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white text-prizma-400 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Terreno</th>
                  <th className="px-4 py-3 text-right">Compra (data / preço)</th>
                  <th className="px-4 py-3 text-right">Valor de mercado</th>
                  <th className="px-4 py-3 text-right">Variação</th>
                  <th className="px-4 py-3 text-right">TIR esperada</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-prizma-200">
                {items.map((item) => {
                  const marketValue = marketValueOf(item);
                  const isReal = item.latestValuationValue !== null;
                  const variance = marketValue !== null ? marketValue - item.totalInvested : null;
                  const variancePct = variance !== null && item.totalInvested > 0
                    ? (variance / item.totalInvested) * 100
                    : null;

                  return (
                    <Fragment key={item.projectId}>
                      <tr className="bg-prizma-50 hover:bg-white">
                        <td className="px-4 py-3">
                          <Link
                            href={`/dashboard/projetos/${item.projectId}`}
                            className="text-prizma-400 hover:text-prizma-300"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-prizma-600">{fmtBrl(item.totalInvested)}</span>
                          {item.purchaseDate && (
                            <p className="text-[10px] text-prizma-400">{fmtDate(item.purchaseDate)}</p>
                          )}
                          <button
                            onClick={() => setEditingPurchaseId(editingPurchaseId === item.projectId ? null : item.projectId)}
                            className="block text-prizma-400 hover:text-prizma-600 text-[10px] mt-0.5"
                          >
                            editar compra
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-positive">
                          {fmtBrl(marketValue)}
                          {marketValue !== null && (
                            <p className="text-[10px] text-prizma-400">
                              {isReal
                                ? `avaliação: ${fmtDate(item.latestValuationDate)}`
                                : `esperado (marco): ${fmtDate(item.baselineDeliveryDate)}`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {variance !== null ? (
                            <span className={variance >= 0 ? "text-positive" : "text-negative"}>
                              {fmtBrl(variance)}
                              {variancePct !== null && (
                                <span className="text-[10px] block">{variancePct.toFixed(1)}%</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-prizma-400 text-xs">sem avaliação</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {item.baselineIrr !== null ? (
                            <span className="text-prizma-700 font-mono">{fmtPct(item.baselineIrr)}</span>
                          ) : (
                            <span className="text-prizma-400 text-xs">sem marco</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingBaselineId(editingBaselineId === item.projectId ? null : item.projectId)}
                            className="text-prizma-400 hover:text-prizma-600 text-xs mr-3"
                          >
                            {item.baselineIrr !== null ? "editar marco" : "+ marco"}
                          </button>
                          <button
                            onClick={() => handleDelete(item.projectId, item.name)}
                            className="text-negative hover:text-negative text-xs"
                          >
                            remover
                          </button>
                        </td>
                      </tr>

                      {editingPurchaseId === item.projectId && (
                        <tr className="bg-white">
                          <td colSpan={6} className="px-4 py-3">
                            <TerrenoPurchaseForm
                              projectId={item.projectId}
                              eventId={item.purchaseEventId}
                              currentDate={item.purchaseDate}
                              currentValue={item.purchaseValue}
                              onSaved={() => { setEditingPurchaseId(null); load(); }}
                            />
                          </td>
                        </tr>
                      )}

                      {editingBaselineId === item.projectId && (
                        <tr className="bg-white">
                          <td colSpan={6} className="px-4 py-3">
                            <TerrenoBaselineForm
                              projectId={item.projectId}
                              totalInvested={item.totalInvested}
                              onCreated={() => { setEditingBaselineId(null); load(); }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-prizma-400">Nenhum terreno cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
