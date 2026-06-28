"use client";

import { useState } from "react";

interface TerrenoBaselineFormProps {
  projectId: string;
  totalInvested: number;
  onCreated?: () => void;
}

/**
 * Marco simplificado pra terreno: só pede valor de mercado esperado na entrega
 * e a data esperada. TIR é calculada a partir do investido até hoje vs. esse valor futuro.
 */
export function TerrenoBaselineForm({ projectId, totalInvested, onCreated }: TerrenoBaselineFormProps) {
  const [deliveryValue, setDeliveryValue] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (totalInvested <= 0) {
      setError("Lance o valor investido no terreno antes de criar o marco.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const today = new Date().toISOString().split("T")[0];
    const value = parseFloat(deliveryValue.replace(",", "."));

    const res = await fetch(`/api/projects/${projectId}/baselines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: "Expectativa de entrega",
        projectedCashFlows: [
          { date: today, amount: -totalInvested },
          { date: deliveryDate, amount: value },
        ],
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error) ?? "Erro ao criar marco");
      setSubmitting(false);
      return;
    }

    const created = await res.json();
    await fetch(`/api/projects/${projectId}/baselines/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "freeze" }),
    });

    setSubmitting(false);
    setDeliveryValue("");
    setDeliveryDate("");
    onCreated?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div>
        <label className="block text-[10px] text-prizma-400 mb-1">Valor de mercado (na entrega)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={deliveryValue}
          onChange={(e) => setDeliveryValue(e.target.value)}
          required
          placeholder="0,00"
          className="bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 w-36"
        />
      </div>
      <div>
        <label className="block text-[10px] text-prizma-400 mb-1">Data esperada de entrega</label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          required
          className="bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="px-3 py-1.5 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded text-xs text-white"
      >
        {submitting ? "..." : "Calcular TIR"}
      </button>
      {error && <p className="text-negative text-[10px] ml-2">{error}</p>}
    </form>
  );
}
