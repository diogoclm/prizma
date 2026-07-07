import * as XLSX from "xlsx";
import { cashFlowRowSchema, normalizeType, normalizeOrigin } from "./schema";
import type { ParsedCashFlowRow, ParseResult, RawRow, RowError } from "./types";
import { coerceDate, coerceAmount } from "./coerce";

/**
 * Colunas aceitas (case-insensitive, sem acento, com variações comuns):
 *   data | date            → obrigatório
 *   valor | amount          → obrigatório (positivo = entrada, negativo = saída)
 *   tipo | type             → obrigatório (APORTE, DISTRIBUICAO, RECEBIMENTO_VENDA, CUSTO, VALOR_TERMINAL)
 *   origem | origin         → obrigatório (REALIZADO, PROJETADO)
 *   descricao | description → opcional
 */
const HEADER_ALIASES: Record<string, string> = {
  data: "date",
  date: "date",
  valor: "amount",
  amount: "amount",
  tipo: "type",
  type: "type",
  origem: "origin",
  origin: "origin",
  descricao: "description",
  "descrição": "description",
  description: "description",
};

function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

/** Converte um buffer (xlsx ou csv) em linhas brutas normalizadas por cabeçalho. */
export function parseWorkbookToRawRows(buffer: Buffer | ArrayBuffer): RawRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: true,
    defval: undefined,
  });

  return rows.map((row) => {
    const normalized: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = value;
    }
    return normalized;
  });
}

/** Valida e converte as linhas brutas em eventos de fluxo de caixa, linha a linha. */
export function validateRows(rawRows: RawRow[]): ParseResult {
  const validRows: ParsedCashFlowRow[] = [];
  const errors: RowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // +1 (1-based) +1 (linha de cabeçalho)

    const date = coerceDate(raw.date);
    const amount = coerceAmount(raw.amount);
    const typeRaw = typeof raw.type === "string" ? raw.type : String(raw.type ?? "");
    const originRaw = typeof raw.origin === "string" ? raw.origin : String(raw.origin ?? "");
    const type = normalizeType(typeRaw);
    const origin = normalizeOrigin(originRaw);
    const description = raw.description != null ? String(raw.description) : undefined;

    if (!date) {
      errors.push({ row: rowNumber, message: `Coluna "data" ausente ou inválida: "${raw.date}"` });
      return;
    }
    if (amount === undefined) {
      errors.push({ row: rowNumber, message: `Coluna "valor" ausente ou inválida: "${raw.amount}"` });
      return;
    }
    if (!type) {
      errors.push({
        row: rowNumber,
        message: `Coluna "tipo" inválida: "${raw.type}". Esperado: APORTE, DISTRIBUICAO, RECEBIMENTO_VENDA, CUSTO ou VALOR_TERMINAL`,
      });
      return;
    }
    if (!origin) {
      errors.push({
        row: rowNumber,
        message: `Coluna "origem" inválida: "${raw.origin}". Esperado: REALIZADO ou PROJETADO`,
      });
      return;
    }

    const result = cashFlowRowSchema.safeParse({ date, amount, type, origin, description });
    if (!result.success) {
      errors.push({ row: rowNumber, message: result.error.errors.map((e) => e.message).join("; ") });
      return;
    }

    validRows.push({ rowNumber, ...result.data });
  });

  return { validRows, errors, totalRows: rawRows.length };
}

/** Função de conveniência: buffer → resultado validado, em um único passo. */
export function parseAndValidate(buffer: Buffer | ArrayBuffer): ParseResult {
  const rawRows = parseWorkbookToRawRows(buffer);
  return validateRows(rawRows);
}
