"use client";

import { useState } from "react";

const TYPE_OPTIONS = [
  { value: "APORTE", label: "Aporte (acionista → Prizma)" },
  { value: "DIVIDENDO", label: "Dividendo (Prizma → acionista)" },
  { value: "ADMINISTRACAO", label: "Administração (Prizma → acionista)" },
];

interface ProjectOption {
  projectId: string;
  projectName: string;
}

interface ShareholderTxFormProps {
  shareholderId: string;
  defaultType?: "APORTE" | "DIVIDENDO" | "ADMINISTRACAO";
  lockType?: boolean;
  projectOptions?: ProjectOption[];
  onCreated?: () => void;
}

export function ShareholderTxForm({ shareholderId, defaultType = "APORTE", lockType = false, projectOptions, onCreated }: ShareholderTxFormProps) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState(defaultType);
  const [reason, setReason] = useState("");
  const [source, setSource] = useState("");
  const [projectId, setProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const showProjectSelector = !!projectOptions;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/shareholders/${shareholderId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        amount: parseFloat(amount.replace(",", ".")),
        type,
        reason: reason || undefined,
        source: source || undefined,
        projectId: showProjectSelector ? (projectId || undefined) : undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao lançar");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setDate("");
    setAmount("");
    setReason("");
    setSource("");
    setProjectId("");
    onCreated?.();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Novo lançamento</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
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
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          disabled={lockType}
          className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm disabled:opacity-60"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {showProjectSelector && (
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Projeto</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          >
            <option value="">Selecione...</option>
            {projectOptions!.map((p) => (
              <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Motivo</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Distribuição 1º trimestre"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Origem</label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ex: Hotel Nannai, SPE Alpha"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-negative text-xs">{error}</p>}
      {success && <p className="text-positive text-xs">Lançado com sucesso.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
      >
        {submitting ? "Lançando..." : "Lançar"}
      </button>
    </form>
  );
}
