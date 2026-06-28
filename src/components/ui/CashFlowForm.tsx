"use client";

import { useState } from "react";

const TYPE_OPTIONS = [
  { value: "APORTE", label: "Aporte" },
  { value: "DISTRIBUICAO", label: "Distribuição" },
  { value: "RECEBIMENTO_VENDA", label: "Recebimento de Venda" },
  { value: "CUSTO", label: "Custo" },
  { value: "VALOR_TERMINAL", label: "Valor Terminal" },
];

interface CashFlowFormProps {
  projectId: string;
  onCreated?: () => void;
}

export function CashFlowForm({ projectId, onCreated }: CashFlowFormProps) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"saida" | "entrada">("saida");
  const [type, setType] = useState("APORTE");
  const [origin, setOrigin] = useState<"REALIZADO" | "PROJETADO">("REALIZADO");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const numericAmount = Math.abs(parseFloat(amount.replace(",", ".")));
    const signedAmount = direction === "saida" ? -numericAmount : numericAmount;

    const res = await fetch(`/api/projects/${projectId}/cashflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        amount: signedAmount,
        type,
        origin,
        description: description || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao lançar evento");
    } else {
      setSuccess(true);
      setDate("");
      setAmount("");
      setDescription("");
      onCreated?.();
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Lançar novo evento</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0,00"
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Direção</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "saida" | "entrada")}
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          >
            <option value="saida">Saída (aporte/custo)</option>
            <option value="entrada">Entrada (recebimento)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Origem</label>
          <select
            value={origin}
            onChange={(e) => setOrigin(e.target.value as "REALIZADO" | "PROJETADO")}
            className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          >
            <option value="REALIZADO">Realizado</option>
            <option value="PROJETADO">Projetado</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Descrição (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ex: 2ª parcela do aporte"
          className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
      </div>

      {error && <p className="text-negative text-xs">{error}</p>}
      {success && <p className="text-positive text-xs">Evento lançado com sucesso.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-prizma-600 hover:bg-prizma-700 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
      >
        {submitting ? "Lançando..." : "Lançar evento"}
      </button>
    </form>
  );
}
