"use client";

import { useState, useRef } from "react";

interface PreviewRow {
  row: number;
  date: string;
  amount: number;
  type: string;
  origin: string;
  description: string | null;
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
  importBatchId: string;
  inserted: number;
  errors: RowError[];
  status: string;
}

const TYPE_LABELS: Record<string, string> = {
  APORTE: "Aporte",
  DISTRIBUICAO: "Distribuição",
  RECEBIMENTO_VENDA: "Receb. Venda",
  CUSTO: "Custo",
  VALOR_TERMINAL: "Valor Terminal",
};

const ORIGIN_COLORS: Record<string, string> = {
  REALIZADO: "text-positive",
  PROJETADO: "text-prizma-700",
};

export default function ImportarPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [projectId, setProjectId] = useState("spe-001");
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

    const res = await fetch(`/api/projects/${projectId}/imports/preview`, {
      method: "POST",
      body: form,
    });
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

    const res = await fetch(`/api/projects/${projectId}/imports`, {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Erro ao importar");
    } else {
      setImportResult(data as ImportResponse);
      setPreview(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    setLoading(null);
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-prizma-900">Importar Planilha</h1>
      <p className="text-prizma-400 mt-1 mb-6 text-sm">
        Formatos aceitos: CSV ou XLSX. Colunas obrigatórias:{" "}
        <code className="text-prizma-600">data, valor, tipo, origem</code>. Opcional:{" "}
        <code className="text-prizma-600">descricao</code>.
      </p>

      {/* Formulário */}
      <div className="bg-white rounded-xl border border-prizma-300 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-prizma-400 mb-1">Projeto</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-prizma-100 border border-prizma-300 rounded-lg px-3 py-2 text-prizma-900 text-sm"
            >
              <option value="hotel-001">Hotel Prizma (Operação)</option>
              <option value="spe-001">SPE Residencial Alpha</option>
              <option value="spe-002">SPE Comercial Beta</option>
              <option value="spe-003">SPE Residencial Gamma</option>
              <option value="spe-004">SPE Delta (Pré-lançamento)</option>
              <option value="lb-001">Terreno Epsilon</option>
              <option value="lb-002">Terreno Zeta</option>
              <option value="lb-003">Terreno Eta</option>
              <option value="lb-004">Terreno Theta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-prizma-400 mb-1">Arquivo (CSV / XLSX)</label>
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
          </div>
        </div>

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
              className="px-4 py-2 bg-prizma-600 hover:bg-prizma-700 disabled:opacity-40 rounded-lg text-sm text-white transition-colors"
            >
              {loading === "import"
                ? "Importando..."
                : `Confirmar importação (${preview.validCount} linha${preview.validCount > 1 ? "s" : ""})`}
            </button>
          )}
        </div>
      </div>

      {/* Erro global */}
      {error && (
        <div className="mt-4 bg-negative-bg border border-negative-border rounded-lg px-4 py-3 text-negative text-sm">
          {error}
        </div>
      )}

      {/* Resultado da importação */}
      {importResult && (
        <div className="mt-4 bg-positive-bg border border-positive-border rounded-lg px-4 py-4">
          <p className="text-positive font-semibold">
            {importResult.inserted} evento{importResult.inserted > 1 ? "s" : ""} importado
            {importResult.inserted > 1 ? "s" : ""} com sucesso.
          </p>
          <p className="text-prizma-400 text-xs mt-1">Batch ID: {importResult.importBatchId}</p>
          {importResult.errors.length > 0 && (
            <ErrorTable errors={importResult.errors} />
          )}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-6 space-y-4">
          {/* Resumo */}
          <div className="flex gap-4">
            <Stat label="Total de linhas" value={preview.totalRows} color="slate" />
            <Stat label="Válidas" value={preview.validCount} color="emerald" />
            <Stat label="Com erro" value={preview.errorCount} color="red" />
          </div>

          {/* Tabela de preview */}
          {preview.preview.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-prizma-600 mb-2">
                Pré-visualização (primeiras {preview.preview.length} linhas)
              </h2>
              <div className="overflow-x-auto rounded-lg border border-prizma-300">
                <table className="w-full text-sm">
                  <thead className="bg-white text-prizma-400 text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-right">Valor (R$)</th>
                      <th className="px-3 py-2 text-left">Tipo</th>
                      <th className="px-3 py-2 text-left">Origem</th>
                      <th className="px-3 py-2 text-left">Descrição</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-prizma-200">
                    {preview.preview.map((row) => (
                      <tr key={row.row} className="bg-prizma-50 hover:bg-white">
                        <td className="px-3 py-2 text-prizma-400">{row.row}</td>
                        <td className="px-3 py-2 text-prizma-600">{row.date}</td>
                        <td
                          className={`px-3 py-2 text-right font-mono ${
                            row.amount < 0 ? "text-negative" : "text-positive"
                          }`}
                        >
                          {row.amount.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-prizma-600">
                          {TYPE_LABELS[row.type] ?? row.type}
                        </td>
                        <td className={`px-3 py-2 ${ORIGIN_COLORS[row.origin] ?? "text-prizma-600"}`}>
                          {row.origin}
                        </td>
                        <td className="px-3 py-2 text-prizma-400">{row.description ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Erros por linha */}
          {preview.errors.length > 0 && <ErrorTable errors={preview.errors} />}
        </div>
      )}

      {/* Template de planilha */}
      <div className="mt-8 bg-white rounded-xl border border-prizma-300 p-5">
        <h2 className="text-sm font-semibold text-prizma-600 mb-3">Formato esperado da planilha</h2>
        <div className="overflow-x-auto">
          <table className="text-xs text-prizma-400 border-collapse">
            <thead>
              <tr className="text-prizma-600">
                {["data", "valor", "tipo", "origem", "descricao"].map((h) => (
                  <th key={h} className="border border-prizma-300 px-3 py-1 bg-prizma-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-prizma-300 px-3 py-1">2024-03-15</td>
                <td className="border border-prizma-300 px-3 py-1">-500000</td>
                <td className="border border-prizma-300 px-3 py-1">APORTE</td>
                <td className="border border-prizma-300 px-3 py-1">REALIZADO</td>
                <td className="border border-prizma-300 px-3 py-1">Aporte inicial</td>
              </tr>
              <tr>
                <td className="border border-prizma-300 px-3 py-1">2025-06-01</td>
                <td className="border border-prizma-300 px-3 py-1">750000</td>
                <td className="border border-prizma-300 px-3 py-1">RECEBIMENTO_VENDA</td>
                <td className="border border-prizma-300 px-3 py-1">PROJETADO</td>
                <td className="border border-prizma-300 px-3 py-1">Vendas unidades</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-prizma-400 mt-2">
          Tipos válidos: APORTE, DISTRIBUICAO, RECEBIMENTO_VENDA, CUSTO, VALOR_TERMINAL.
          Origens válidas: REALIZADO, PROJETADO. Datas: AAAA-MM-DD ou DD/MM/AAAA.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "slate" | "emerald" | "red";
}) {
  const colorMap = {
    slate: "text-prizma-900 bg-prizma-100 border-prizma-300",
    emerald: "text-positive bg-positive-bg border-positive-border",
    red: "text-negative bg-negative-bg border-negative-border",
  };
  return (
    <div className={`rounded-lg border px-4 py-3 ${colorMap[color]}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function ErrorTable({ errors }: { errors: RowError[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-negative mb-2">
        Erros encontrados ({errors.length})
      </h2>
      <div className="rounded-lg border border-negative-border overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-negative-bg text-negative">
            <tr>
              <th className="px-3 py-2 text-left w-16">Linha</th>
              <th className="px-3 py-2 text-left">Mensagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-negative-border">
            {errors.map((e) => (
              <tr key={e.row} className="bg-prizma-50">
                <td className="px-3 py-2 text-negative font-mono">{e.row}</td>
                <td className="px-3 py-2 text-prizma-600">{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
