"use client";

import { useState } from "react";
import { fmtBrl, fmtPct } from "@/lib/format";
import { calcPLProjectBase } from "@/lib/pl/calc";

interface PLProject {
  id: string;
  name: string;
  liquidCashGenPct: number;
  liquidCashGen: number;
  officeDiscount: number;
  phase: string | null;
  phasePct: number;
  notes: string | null;
}

interface PLProjectRowProps {
  yearId: string;
  project: PLProject;
  onChanged: () => void;
}

export function PLProjectRow({ yearId, project, onChanged }: PLProjectRowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [liquidCashGen, setLiquidCashGen] = useState(String(project.liquidCashGen));
  const [liquidCashGenPct, setLiquidCashGenPct] = useState(String(project.liquidCashGenPct * 100));
  const [officeDiscount, setOfficeDiscount] = useState(String(project.officeDiscount));
  const [phase, setPhase] = useState(project.phase ?? "");
  const [phasePct, setPhasePct] = useState(String(project.phasePct * 100));
  const [notes, setNotes] = useState(project.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/pl/years/${yearId}/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        liquidCashGen: parseFloat(liquidCashGen.replace(",", ".")) || 0,
        liquidCashGenPct: (parseFloat(liquidCashGenPct.replace(",", ".")) || 0) / 100,
        officeDiscount: parseFloat(officeDiscount.replace(",", ".")) || 0,
        phase: phase || null,
        phasePct: (parseFloat(phasePct.replace(",", ".")) || 0) / 100,
        notes: notes || undefined,
      }),
    });
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("Remover este projeto?")) return;
    await fetch(`/api/pl/years/${yearId}/projects/${project.id}`, { method: "DELETE" });
    onChanged();
  }

  if (!editing) {
    return (
      <tr className="bg-white hover:bg-prizma-50">
        <td className="px-4 py-2 text-prizma-900">{project.name}</td>
        <td className="px-4 py-2 text-prizma-600">{project.phase ?? "—"}</td>
        <td className="px-4 py-2 text-right font-mono text-prizma-600">{fmtBrl(project.liquidCashGen)}</td>
        <td className="px-4 py-2 text-right font-mono text-prizma-600">{fmtPct(project.liquidCashGenPct)}</td>
        <td className="px-4 py-2 text-right font-mono text-prizma-600">{fmtBrl(project.officeDiscount)}</td>
        <td className="px-4 py-2 text-right font-mono text-prizma-600">{fmtPct(project.phasePct)}</td>
        <td className="px-4 py-2 text-right font-mono text-prizma-900">{fmtBrl(calcPLProjectBase(project))}</td>
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
      <td className="px-2 py-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900" />
      </td>
      <td className="px-2 py-2">
        <input type="text" value={phase} onChange={(e) => setPhase(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900" />
      </td>
      <td className="px-2 py-2">
        <input type="number" step="0.01" value={liquidCashGen} onChange={(e) => setLiquidCashGen(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 text-right font-mono" />
      </td>
      <td className="px-2 py-2">
        <input type="number" step="0.01" value={liquidCashGenPct} onChange={(e) => setLiquidCashGenPct(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 text-right font-mono" />
      </td>
      <td className="px-2 py-2">
        <input type="number" step="0.01" value={officeDiscount} onChange={(e) => setOfficeDiscount(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 text-right font-mono" />
      </td>
      <td className="px-2 py-2">
        <input type="number" step="0.01" value={phasePct} onChange={(e) => setPhasePct(e.target.value)}
          className="w-full bg-white border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 text-right font-mono" />
      </td>
      <td className="px-2 py-2 text-right text-xs text-prizma-400">—</td>
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
