"use client";

import { useState } from "react";

interface TerrenoPurchaseFormProps {
  projectId: string;
  eventId: string | null;
  currentDate: string | null;
  currentValue: number | null;
  onSaved?: () => void;
}

/**
 * Edita (ou cria, se ainda não existir) o lançamento de compra do terreno:
 * data e preço de compra. Sempre um APORTE REALIZADO (saída de caixa).
 */
export function TerrenoPurchaseForm({ projectId, eventId, currentDate, currentValue, onSaved }: TerrenoPurchaseFormProps) {
  const [date, setDate] = useState(currentDate ? currentDate.split("T")[0] : "");
  const [value, setValue] = useState(currentValue !== null ? String(currentValue) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const amount = -Math.abs(parseFloat(value.replace(",", ".")));

    const res = eventId
      ? await fetch(`/api/projects/${projectId}/cashflows/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, amount }),
        })
      : await fetch(`/api/projects/${projectId}/cashflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, amount, type: "APORTE", origin: "REALIZADO", description: "Compra do terreno" }),
        });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao salvar");
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved?.();
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
      />
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Preço de compra"
        className="bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 w-32 text-right"
      />
      <button
        onClick={handleSave}
        disabled={saving || !date || !value}
        className="text-positive hover:text-positive text-xs disabled:opacity-40"
      >
        {saving ? "..." : "salvar"}
      </button>
      {error && <span className="text-negative text-[10px]">{error}</span>}
    </div>
  );
}
