"use client";

import { useState } from "react";
import { fmtBrl, fmtDate } from "@/lib/format";

interface CashFlowEvent {
  id: string;
  date: string;
  amount: number;
  type: string;
  origin: string;
  description: string | null;
}

const TYPE_OPTIONS = [
  { value: "APORTE", label: "Aporte" },
  { value: "DISTRIBUICAO", label: "Distribuição" },
  { value: "RECEBIMENTO_VENDA", label: "Receb. Venda" },
  { value: "CUSTO", label: "Custo" },
  { value: "VALOR_TERMINAL", label: "Valor Terminal" },
];

interface CashFlowRowProps {
  projectId: string;
  event: CashFlowEvent;
  onChanged: () => void;
}

export function CashFlowRow({ projectId, event, onChanged }: CashFlowRowProps) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(event.date.split("T")[0]);
  const [amount, setAmount] = useState(String(event.amount));
  const [type, setType] = useState(event.type);
  const [origin, setOrigin] = useState(event.origin);
  const [description, setDescription] = useState(event.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/projects/${projectId}/cashflows/${event.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        amount: parseFloat(amount.replace(",", ".")),
        type,
        origin,
        description: description || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao salvar");
      setSaving(false);
      return;
    }

    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("Remover este lançamento?")) return;
    await fetch(`/api/projects/${projectId}/cashflows/${event.id}`, { method: "DELETE" });
    onChanged();
  }

  if (!editing) {
    return (
      <tr className="bg-prizma-50 hover:bg-white">
        <td className="px-4 py-2 text-prizma-600">{fmtDate(event.date)}</td>
        <td className={`px-4 py-2 text-right font-mono ${event.amount < 0 ? "text-negative" : "text-positive"}`}>
          {fmtBrl(event.amount)}
        </td>
        <td className="px-4 py-2 text-prizma-600">
          {TYPE_OPTIONS.find((t) => t.value === event.type)?.label ?? event.type}
        </td>
        <td className="px-4 py-2 text-prizma-400">{event.origin}</td>
        <td className="px-4 py-2 text-prizma-400">{event.description ?? "—"}</td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <button onClick={() => setEditing(true)} className="text-prizma-700 hover:text-prizma-900 text-xs mr-3">
            editar
          </button>
          <button onClick={handleDelete} className="text-negative hover:text-negative text-xs">
            remover
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-white">
      <td className="px-2 py-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 text-right font-mono"
        />
      </td>
      <td className="px-2 py-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className="w-full bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
        >
          <option value="REALIZADO">Realizado</option>
          <option value="PROJETADO">Projetado</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
        />
      </td>
      <td className="px-2 py-2 text-right whitespace-nowrap">
        {error && <p className="text-negative text-[10px] mb-1">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-positive hover:text-positive text-xs mr-3 disabled:opacity-40"
        >
          {saving ? "salvando..." : "salvar"}
        </button>
        <button onClick={() => setEditing(false)} className="text-prizma-400 hover:text-prizma-600 text-xs">
          cancelar
        </button>
      </td>
    </tr>
  );
}
