"use client";

import { useState } from "react";

interface PLProjectFormProps {
  yearId: string;
  onCreated?: () => void;
}

export function PLProjectForm({ yearId, onCreated }: PLProjectFormProps) {
  const [name, setName] = useState("");
  const [liquidCashGen, setLiquidCashGen] = useState("");
  const [liquidCashGenPct, setLiquidCashGenPct] = useState("");
  const [officeDiscount, setOfficeDiscount] = useState("");
  const [phase, setPhase] = useState("");
  const [phasePct, setPhasePct] = useState("100");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/pl/years/${yearId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        liquidCashGen: parseFloat(liquidCashGen.replace(",", ".")) || 0,
        liquidCashGenPct: (parseFloat(liquidCashGenPct.replace(",", ".")) || 0) / 100,
        officeDiscount: parseFloat(officeDiscount.replace(",", ".")) || 0,
        phase: phase || undefined,
        phasePct: (parseFloat(phasePct.replace(",", ".")) || 0) / 100,
        notes: notes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao adicionar projeto");
      setSubmitting(false);
      return;
    }

    setName("");
    setLiquidCashGen("");
    setLiquidCashGenPct("");
    setOfficeDiscount("");
    setPhase("");
    setPhasePct("100");
    setNotes("");
    onCreated?.();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Novo projeto / meta entregue</h3>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Nome do projeto</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: Hotel Nannai — expansão"
          className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Geração Líq. de Caixa (R$)</label>
          <input
            type="number"
            step="0.01"
            value={liquidCashGen}
            onChange={(e) => setLiquidCashGen(e.target.value)}
            placeholder="0,00"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">% da GLC considerado</label>
          <input
            type="number"
            step="0.01"
            value={liquidCashGenPct}
            onChange={(e) => setLiquidCashGenPct(e.target.value)}
            placeholder="Ex: 10 para 10%"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Desconto custo escritório (R$)</label>
          <input
            type="number"
            step="0.01"
            value={officeDiscount}
            onChange={(e) => setOfficeDiscount(e.target.value)}
            placeholder="0,00"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Fase</label>
          <input
            type="text"
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            placeholder="Ex: Fase 1, Entrega"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">% da fase</label>
          <input
            type="number"
            step="0.01"
            value={phasePct}
            onChange={(e) => setPhasePct(e.target.value)}
            placeholder="Ex: 100 para 100%"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Observações</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional"
          className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
      </div>

      {error && <p className="text-negative text-xs">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
      >
        {submitting ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}
