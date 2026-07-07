"use client";

import { useState } from "react";
import { fmtBrl, fmtDate } from "@/lib/format";

interface Tx {
  id: string;
  date: string;
  amount: number;
  type: "APORTE" | "DIVIDENDO" | "ADMINISTRACAO";
  reason: string | null;
  source: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  APORTE: "Aporte",
  DIVIDENDO: "Dividendo",
  ADMINISTRACAO: "Administração",
};

interface ShareholderTxRowProps {
  shareholderId: string;
  tx: Tx;
  onChanged: () => void;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

export function ShareholderTxRow({ shareholderId, tx, onChanged, selected, onToggleSelect }: ShareholderTxRowProps) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(tx.date.split("T")[0]);
  const [amount, setAmount] = useState(String(tx.amount));
  const [type, setType] = useState(tx.type);
  const [reason, setReason] = useState(tx.reason ?? "");
  const [source, setSource] = useState(tx.source ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/shareholders/${shareholderId}/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        amount: parseFloat(amount.replace(",", ".")),
        type,
        reason: reason || undefined,
        source: source || undefined,
      }),
    });
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("Remover este lançamento?")) return;
    await fetch(`/api/shareholders/${shareholderId}/transactions/${tx.id}`, { method: "DELETE" });
    onChanged();
  }

  if (!editing) {
    return (
      <tr className="bg-white hover:bg-prizma-50">
        <td className="px-3 py-2">
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect(tx.id)} className="rounded border-prizma-300" />
        </td>
        <td className="px-4 py-2 text-prizma-600">{fmtDate(tx.date)}</td>
        <td className="px-4 py-2">
          <span className={`px-2 py-0.5 rounded text-xs ${
            tx.type === "APORTE" ? "bg-positive-bg text-positive" : "bg-prizma-100 text-prizma-600"
          }`}>
            {TYPE_LABELS[tx.type]}
          </span>
        </td>
        <td className="px-4 py-2 text-right font-mono text-prizma-900">{fmtBrl(tx.amount)}</td>
        <td className="px-4 py-2 text-prizma-500">{tx.reason ?? "—"}</td>
        <td className="px-4 py-2 text-prizma-500">{tx.source ?? "—"}</td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <button onClick={() => setEditing(true)} className="text-prizma-600 hover:text-prizma-900 text-xs mr-3">
            editar
          </button>
          <button onClick={handleDelete} className="text-negative hover:opacity-80 text-xs">
            remover
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-prizma-100">
      <td className="px-3 py-2">
        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(tx.id)} className="rounded border-prizma-300" />
      </td>
      <td className="px-2 py-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900" />
      </td>
      <td className="px-2 py-2">
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900">
          <option value="APORTE">Aporte</option>
          <option value="DIVIDENDO">Dividendo</option>
          <option value="ADMINISTRACAO">Administração</option>
        </select>
      </td>
      <td className="px-2 py-2">
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 text-right font-mono" />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900" />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={source} onChange={(e) => setSource(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900" />
      </td>
      <td className="px-2 py-2 text-right whitespace-nowrap">
        <button onClick={handleSave} disabled={saving} className="text-positive hover:opacity-80 text-xs mr-3 disabled:opacity-40">
          {saving ? "..." : "salvar"}
        </button>
        <button onClick={() => setEditing(false)} className="text-prizma-400 hover:text-prizma-600 text-xs">
          cancelar
        </button>
      </td>
    </tr>
  );
}
