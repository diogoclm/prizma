"use client";

import { useState, useRef } from "react";
import { fmtBrl } from "@/lib/format";

interface PreviewRow {
  row: number;
  shareholderName: string;
  date: string;
  amount: number;
  type: string;
  reason: string | null;
  source: string | null;
  projectName: string | null;
}

interface RowError {
  row: number;
  message: string;
}

interface PreviewResponse {
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: RowError[];
  preview: PreviewRow[];
}

interface ImportResponse {
  inserted: number;
  errors: RowError[];
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  APORTE: "Aporte",
  DIVIDENDO: "Dividendo",
  ADMINISTRACAO: "Administração",
};

export function ShareholderImportForm({ onImported }: { onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [loading, setLoading] = useState<"preview" | "import" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!file) return;
    setLoading("preview");
    setError(null);
    setImportResult(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/shareholders/import/preview", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao processar arquivo");
    } else {
      setPreview(data as PreviewResponse);
    }
    setLoading(null);
  }

  async function handleImport() {
    if (!file || !preview) return;
    setLoading("import");
    setError(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/shareholders/import", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao importar");
    } else {
      setImportResult(data as ImportResponse);
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      onImported?.();
    }
    setLoading(null);
  }

  return (
    <div className="bg-white rounded-xl border border-prizma-300 p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-prizma-600">Importar planilha</h3>
        <p className="text-xs text-prizma-400 mt-1">
          Colunas obrigatórias: <code className="text-prizma-600">acionista, data, valor, tipo</code>. Opcional:{" "}
          <code className="text-prizma-600">motivo, origem, projeto</code> (projeto só se aplica a lançamentos de administração).
          Tipos válidos: APORTE, DIVIDENDO, ADMINISTRACAO.
        </p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          setPreview(null);
          setImportResult(null);
          setError(null);
        }}
        className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-600 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-prizma-600 file:text-white file:text-xs"
      />

      <div className="flex gap-3">
        <button
          onClick={handlePreview}
          disabled={!file || loading !== null}
          className="px-4 py-2 bg-prizma-200 hover:bg-prizma-500 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
        >
          {loading === "preview" ? "Analisando..." : "Pré-visualizar"}
        </button>

        {preview && preview.validCount > 0 && (
          <button
            onClick={handleImport}
            disabled={loading !== null}
            className="px-4 py-2 bg-prizma-800 hover:bg-prizma-900 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
          >
            {loading === "import"
              ? "Importando..."
              : `Confirmar importação (${preview.validCount} linha${preview.validCount > 1 ? "s" : ""})`}
          </button>
        )}
      </div>

      {error && <p className="text-negative text-xs">{error}</p>}

      {importResult && (
        <div className="bg-positive-bg border border-positive-border rounded-lg px-4 py-3">
          <p className="text-positive text-sm font-semibold">
            {importResult.inserted} lançamento{importResult.inserted > 1 ? "s" : ""} importado{importResult.inserted > 1 ? "s" : ""} com sucesso.
          </p>
          {importResult.errors.length > 0 && <ErrorList errors={importResult.errors} />}
        </div>
      )}

      {preview && (
        <div className="space-y-3">
          <div className="flex gap-4 text-xs">
            <span className="text-prizma-600">Total: {preview.totalRows}</span>
            <span className="text-positive">Válidas: {preview.validCount}</span>
            <span className="text-negative">Com erro: {preview.errorCount}</span>
          </div>

          {preview.preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-prizma-300">
              <table className="w-full text-xs">
                <thead className="bg-prizma-100 text-prizma-400">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Acionista</th>
                    <th className="px-3 py-2 text-left">Data</th>
                    <th className="px-3 py-2 text-right">Valor</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-left">Projeto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-prizma-200">
                  {preview.preview.map((row) => (
                    <tr key={row.row} className="bg-white">
                      <td className="px-3 py-2 text-prizma-400">{row.row}</td>
                      <td className="px-3 py-2 text-prizma-900">{row.shareholderName}</td>
                      <td className="px-3 py-2 text-prizma-600">{row.date}</td>
                      <td className="px-3 py-2 text-right font-mono text-prizma-900">{fmtBrl(row.amount)}</td>
                      <td className="px-3 py-2 text-prizma-600">{TYPE_LABELS[row.type] ?? row.type}</td>
                      <td className="px-3 py-2 text-prizma-400">{row.projectName ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.errors.length > 0 && <ErrorList errors={preview.errors} />}
        </div>
      )}
    </div>
  );
}

function ErrorList({ errors }: { errors: RowError[] }) {
  return (
    <div className="mt-2">
      <p className="text-negative text-xs font-semibold mb-1">Erros ({errors.length})</p>
      <ul className="text-xs text-prizma-500 space-y-0.5">
        {errors.map((e, i) => (
          <li key={i}>Linha {e.row}: {e.message}</li>
        ))}
      </ul>
    </div>
  );
}
