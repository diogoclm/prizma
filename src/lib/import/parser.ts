import * as XLSX from "xlsx";
import { cashFlowRowSchema, normalizeType, normalizeOrigin } from "./schema";
import type { ParsedCashFlowRow, ParseResult, RawRow, RowError } from "./types";

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

function coerceDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // serial date do Excel
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string") {
    // aceita ISO (2024-01-01) e BR (01/01/2024)
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
    }
    const brMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (brMatch) {
      return new Date(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]));
    }
    const fallback = new Date(value);
    return isNaN(fallback.getTime()) ? undefined : fallback;
  }
  return undefined;
}

function coerceAmount(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    // aceita formato BR: "1.234,56" e formato US: "1234.56"
    const cleaned = value
      .trim()
      .replace(/R\$\s?/, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const num = Number(cleaned);
    if (!isNaN(num)) return num;
    const numUs = Number(value.replace(/[^0-9.-]/g, ""));
    return isNaN(numUs) ? undefined : numUs;
  }
  return undefined;
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
