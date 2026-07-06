"use client";

import { useState } from "react";

interface PLYearFormProps {
  onCreated?: () => void;
}

export function PLYearForm({ onCreated }: PLYearFormProps) {
  const [year, setYear] = useState("");
  const [averageSalary, setAverageSalary] = useState("");
  const [salaryMultiplier, setSalaryMultiplier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/pl/years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: parseInt(year, 10),
        averageSalary: parseFloat(averageSalary.replace(",", ".")) || 0,
        salaryMultiplier: parseFloat(salaryMultiplier.replace(",", ".")) || 0,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.join(", ") ?? "Erro ao criar ano");
      setSubmitting(false);
      return;
    }

    setYear("");
    setAverageSalary("");
    setSalaryMultiplier("");
    onCreated?.();
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Novo ano</h3>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Ano</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            placeholder="2026"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Salário médio (R$)</label>
          <input
            type="number"
            step="0.01"
            value={averageSalary}
            onChange={(e) => setAverageSalary(e.target.value)}
            placeholder="0,00"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Teto (x salários)</label>
          <input
            type="number"
            step="0.1"
            value={salaryMultiplier}
            onChange={(e) => setSalaryMultiplier(e.target.value)}
            placeholder="12"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      {error && <p className="text-negative text-xs">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
      >
        {submitting ? "Criando..." : "Criar ano"}
      </button>
    </form>
  );
}
