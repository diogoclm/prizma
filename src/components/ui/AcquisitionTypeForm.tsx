"use client";

import { useState } from "react";

interface AcquisitionTypeFormProps {
  projectId: string;
  currentType: "COMPRA" | "PERMUTA" | null;
  currentDetails: string | null;
  onSaved?: () => void;
}

export function AcquisitionTypeForm({ projectId, currentType, currentDetails, onSaved }: AcquisitionTypeFormProps) {
  const [type, setType] = useState<"COMPRA" | "PERMUTA">(currentType ?? "COMPRA");
  const [details, setDetails] = useState(currentDetails ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/projects/${projectId}/acquisition`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        acquisitionType: type,
        permutaDetails: type === "PERMUTA" ? details : undefined,
      }),
    });
    setSaving(false);
    onSaved?.();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as "COMPRA" | "PERMUTA")}
        className="bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900"
      >
        <option value="COMPRA">Compra</option>
        <option value="PERMUTA">Permuta</option>
      </select>
      {type === "PERMUTA" && (
        <input
          type="text"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Ex: 20% das unidades futuras"
          className="bg-prizma-100 border border-prizma-300 rounded px-2 py-1 text-xs text-prizma-900 w-48"
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-positive hover:text-positive text-xs disabled:opacity-40"
      >
        {saving ? "..." : "salvar"}
      </button>
    </div>
  );
}
