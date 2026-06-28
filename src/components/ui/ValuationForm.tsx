"use client";

import { useState } from "react";

interface ValuationFormProps {
  projectId: string;
  onCreated?: () => void;
}

export function ValuationForm({ projectId, onCreated }: ValuationFormProps) {
  const [date, setDate] = useState("");
  const [value, setValue] = useState("");
  const [method, setMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/projects/${projectId}/valuations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        value: parseFloat(value.replace(",", ".")),
        method: method || undefined,
        notes: notes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao lançar valuation");
    } else {
      setSuccess(true);
      setDate("");
      setValue("");
      setMethod("");
      setNotes("");
      onCreated?.();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Nova marcação a mercado (valuation)</h3>
      <p className="text-xs text-prizma-400">
        Valor total do projeto (100%) — a fração da Prizma é aplicada automaticamente.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Data da avaliação</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Valor total do projeto (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder="0,00"
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Método (opcional)</label>
        <input
          type="text"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          placeholder="Ex: EBITDA x múltiplo, laudo, estimativa interna"
          className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
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

      {error && <p className="text-negative text-xs">{error}</p>}
      {success && <p className="text-positive text-xs">Valuation lançada com sucesso.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
      >
        {submitting ? "Lançando..." : "Lançar valuation"}
      </button>
    </form>
  );
}
