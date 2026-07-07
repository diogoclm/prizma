"use client";

import { useState } from "react";

const STAGE_OPTIONS = [
  { value: "LANDBANKING", label: "Landbanking" },
  { value: "LANCAMENTO", label: "Lançamento" },
  { value: "CONSTRUCAO", label: "Construção" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "OPERACAO_CONTINUA", label: "Operação Contínua" },
  { value: "ENCERRADO", label: "Encerrado" },
];

interface ProjectCreateFormProps {
  onCreated?: () => void;
}

export function ProjectCreateForm({ onCreated }: ProjectCreateFormProps) {
  const [name, setName] = useState("");
  const [branch, setBranch] = useState<"HOTELEIRO" | "IMOBILIARIO">("IMOBILIARIO");
  const [stage, setStage] = useState("LANDBANKING");
  const [ownershipPct, setOwnershipPct] = useState("100");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        branch,
        stage,
        ownershipPct: parseFloat(ownershipPct.replace(",", ".")) || 100,
        description: description || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao criar projeto");
      setSubmitting(false);
      return;
    }

    setName("");
    setDescription("");
    onCreated?.();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Novo projeto</h3>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Nome</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Ex: SPE Alpha"
          className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Ramo</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value as typeof branch)}
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          >
            <option value="IMOBILIARIO">Incorporação</option>
            <option value="HOTELEIRO">Hoteleiro</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Estágio</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Ownership (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={ownershipPct}
            onChange={(e) => setOwnershipPct(e.target.value)}
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-prizma-400 mb-1">Descrição</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        {submitting ? "Criando..." : "Criar projeto"}
      </button>
    </form>
  );
}
