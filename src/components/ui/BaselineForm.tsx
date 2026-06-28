"use client";

import { useState } from "react";

interface BaselineFormProps {
  projectId: string;
  onCreated?: () => void;
}

/**
 * Form simplificado: define TIR/MOIC esperados direto (sem precisar montar
 * array de fluxos projetados). Usa 2 fluxos sintéticos equivalentes
 * (investimento hoje, retorno na data informada) pra gerar a TIR pedida.
 */
export function BaselineForm({ projectId, onCreated }: BaselineFormProps) {
  const [label, setLabel] = useState("");
  const [tirPct, setTirPct] = useState("");
  const [moic, setMoic] = useState("");
  const [vgv, setVgv] = useState("");
  const [custo, setCusto] = useState("");
  const [notes, setNotes] = useState("");
  const [freeze, setFreeze] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const tir = parseFloat(tirPct.replace(",", ".")) / 100;
    const moicValue = parseFloat(moic.replace(",", "."));

    // Monta 2 fluxos sintéticos: -100 hoje, +100*moic em N anos tal que XIRR = tir informada
    // anos = ln(moic) / ln(1+tir)
    const years = moicValue > 0 && tir > 0 ? Math.log(moicValue) / Math.log(1 + tir) : 1;
    const today = new Date();
    const future = new Date(today);
    future.setDate(future.getDate() + Math.round(years * 365));

    const res = await fetch(`/api/projects/${projectId}/baselines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        assumptionVgv: vgv ? parseFloat(vgv.replace(",", ".")) : undefined,
        assumptionCost: custo ? parseFloat(custo.replace(",", ".")) : undefined,
        assumptionNotes: notes || undefined,
        projectedCashFlows: [
          { date: today.toISOString().split("T")[0], amount: -100 },
          { date: future.toISOString().split("T")[0], amount: 100 * moicValue },
        ],
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error) ?? "Erro ao criar baseline");
      setSubmitting(false);
      return;
    }

    const created = await res.json();

    if (freeze) {
      await fetch(`/api/projects/${projectId}/baselines/${created.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "freeze" }),
      });
    }

    setSuccess(true);
    setLabel(""); setTirPct(""); setMoic(""); setVgv(""); setCusto(""); setNotes("");
    onCreated?.();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Novo marco (baseline)</h3>
      <p className="text-xs text-prizma-400">
        Define a expectativa inicial de retorno. Ao congelar, fica imutável e serve de referência
        pra medir o realizado depois.
      </p>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Nome do marco</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
          placeholder="Ex: Aprovação inicial 2024"
          className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">TIR esperada (% a.a.)</label>
          <input
            type="number"
            step="0.01"
            value={tirPct}
            onChange={(e) => setTirPct(e.target.value)}
            required
            placeholder="Ex: 20"
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">MOIC esperado (múltiplo)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={moic}
            onChange={(e) => setMoic(e.target.value)}
            required
            placeholder="Ex: 1.6"
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">VGV esperado (R$, opcional)</label>
          <input
            type="number"
            step="0.01"
            value={vgv}
            onChange={(e) => setVgv(e.target.value)}
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Custo esperado (R$, opcional)</label>
          <input
            type="number"
            step="0.01"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Observações (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-prizma-400">
        <input type="checkbox" checked={freeze} onChange={(e) => setFreeze(e.target.checked)} />
        Congelar imediatamente (recomendado — fica imutável)
      </label>

      {error && <p className="text-negative text-xs break-all">{error}</p>}
      {success && <p className="text-positive text-xs">Baseline criado com sucesso.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
      >
        {submitting ? "Salvando..." : "Criar marco"}
      </button>
    </form>
  );
}
