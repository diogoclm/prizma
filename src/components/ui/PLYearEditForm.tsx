"use client";

import { useState } from "react";

interface PLYearEditFormProps {
  yearId: string;
  averageSalary: number;
  salaryMultiplier: number;
  amountPaid: number;
  evaluationScore: number | null;
  evaluationNotes: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function PLYearEditForm({
  yearId,
  averageSalary,
  salaryMultiplier,
  amountPaid,
  evaluationScore,
  evaluationNotes,
  onSaved,
  onCancel,
}: PLYearEditFormProps) {
  const [salary, setSalary] = useState(String(averageSalary));
  const [multiplier, setMultiplier] = useState(String(salaryMultiplier));
  const [paid, setPaid] = useState(String(amountPaid));
  const [score, setScore] = useState(evaluationScore !== null ? String(evaluationScore * 100) : "");
  const [notes, setNotes] = useState(evaluationNotes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/pl/years/${yearId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        averageSalary: parseFloat(salary.replace(",", ".")) || 0,
        salaryMultiplier: parseFloat(multiplier.replace(",", ".")) || 0,
        amountPaid: parseFloat(paid.replace(",", ".")) || 0,
        evaluationScore: score === "" ? null : (parseFloat(score.replace(",", ".")) || 0) / 100,
        evaluationNotes: notes || null,
      }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div className="bg-white border border-prizma-300 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-prizma-600">Editar ano</h3>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Salário médio (R$)</label>
          <input
            type="number"
            step="0.01"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Teto (x salários)</label>
          <input
            type="number"
            step="0.1"
            value={multiplier}
            onChange={(e) => setMultiplier(e.target.value)}
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Valor pago (R$)</label>
          <input
            type="number"
            step="0.01"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-prizma-400 mb-1">Avaliação (%)</label>
          <input
            type="number"
            step="1"
            value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="Ex: 85"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-prizma-400 mb-1">Observações da avaliação</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Comentários sobre o ano"
            className="w-full bg-white border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-prizma-100 hover:bg-prizma-200 rounded-lg text-sm text-prizma-800 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
