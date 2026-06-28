"use client";

import { fmtPct, fmtMoic, fmtDate } from "@/lib/format";

interface Baseline {
  id: string;
  version: number;
  label: string;
  frozenAt: string;
  isFrozen: boolean;
  projectedIrr: number | null;
  projectedMoic: number | null;
}

interface BaselineListProps {
  baselines: Baseline[];
  projectId: string;
  onChanged?: () => void;
}

export function BaselineList({ baselines, projectId, onChanged }: BaselineListProps) {
  async function handleDelete(baselineId: string) {
    if (!confirm("Remover este marco? Essa ação não pode ser desfeita.")) return;
    await fetch(`/api/projects/${projectId}/baselines/${baselineId}`, { method: "DELETE" });
    onChanged?.();
  }

  if (baselines.length === 0) {
    return <p className="text-prizma-400 text-sm">Nenhum marco criado ainda.</p>;
  }

  return (
    <div className="rounded-xl border border-prizma-300 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white text-prizma-400 text-xs">
          <tr>
            <th className="px-4 py-2 text-left">Versão</th>
            <th className="px-4 py-2 text-left">Marco</th>
            <th className="px-4 py-2 text-right">TIR esperada</th>
            <th className="px-4 py-2 text-right">MOIC esperado</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-prizma-200">
          {baselines.map((b) => (
            <tr key={b.id} className="bg-prizma-50">
              <td className="px-4 py-2 text-prizma-400">v{b.version}</td>
              <td className="px-4 py-2 text-prizma-800">{b.label}</td>
              <td className="px-4 py-2 text-right font-mono text-prizma-700">{fmtPct(b.projectedIrr)}</td>
              <td className="px-4 py-2 text-right font-mono text-prizma-600">{fmtMoic(b.projectedMoic)}</td>
              <td className="px-4 py-2">
                {b.isFrozen ? (
                  <span className="text-positive text-xs">Congelado</span>
                ) : (
                  <span className="text-prizma-500 text-xs">Rascunho</span>
                )}
              </td>
              <td className="px-4 py-2 text-prizma-400 text-xs">{fmtDate(b.frozenAt)}</td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-negative hover:text-negative text-xs"
                >
                  remover
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
