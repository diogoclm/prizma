import * as XLSX from "xlsx";

/**
 * Colunas aceitas (case-insensitive, sem acento, com variações comuns):
 *   acionista | shareholder        → obrigatório (nome do acionista, deve casar com cadastro)
 *   data | date                    → obrigatório
 *   valor | amount                 → obrigatório (sempre positivo)
 *   tipo | type                    → obrigatório (APORTE, DIVIDENDO, ADMINISTRACAO)
 *   motivo | reason                → opcional
 *   origem | source                → opcional (texto livre)
 *   projeto | project              → opcional (nome do projeto, usado em pagamentos de administração)
 */
const HEADER_ALIASES: Record<string, string> = {
  acionista: "shareholderName",
  shareholder: "shareholderName",
  data: "date",
  date: "date",
  valor: "amount",
  amount: "amount",
  tipo: "type",
  type: "type",
  motivo: "reason",
  reason: "reason",
  descricao: "reason",
  "descrição": "reason",
  description: "reason",
  origem: "source",
  source: "source",
  projeto: "projectName",
  project: "projectName",
};

const TYPE_ALIASES: Record<string, string> = {
  aporte: "APORTE",
  dividendo: "DIVIDENDO",
  administracao: "ADMINISTRACAO",
  "administração": "ADMINISTRACAO",
};

export type RawRow = Record<string, unknown>;

export interface ParsedShareholderTxRow {
  rowNumber: number;
  shareholderName: string;
  date: Date;
  amount: number;
  type: "APORTE" | "DIVIDENDO" | "ADMINISTRACAO";
  reason?: string;
  source?: string;
  projectName?: string;
}

export interface RowError {
  row: number;
  message: string;
}

export interface ParseResult {
  validRows: ParsedShareholderTxRow[];
  errors: RowError[];
  totalRows: number;
}

export function normalizeHeader(h: string): string {
  const key = h.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

function normalizeType(raw: string): string | undefined {
  const key = raw.trim().toLowerCase();
  return TYPE_ALIASES[key] ?? (["APORTE", "DIVIDENDO", "ADMINISTRACAO"].includes(raw.toUpperCase()) ? raw.toUpperCase() : undefined);
}

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
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  if (typeof value === "string") {
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
    const cleaned = value.trim().replace(/R\$\s?/, "").replace(/\./g, "").replace(",", ".");
    const num = Number(cleaned);
    if (!isNaN(num)) return num;
    const numUs = Number(value.replace(/[^0-9.-]/g, ""));
    return isNaN(numUs) ? undefined : numUs;
  }
  return undefined;
}

/** Valida e converte as linhas brutas em lançamentos de acionista, linha a linha. */
export function validateRows(rawRows: RawRow[]): ParseResult {
  const validRows: ParsedShareholderTxRow[] = [];
  const errors: RowError[] = [];

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;

    const shareholderName = raw.shareholderName != null ? String(raw.shareholderName).trim() : "";
    const date = coerceDate(raw.date);
    const amount = coerceAmount(raw.amount);
    const typeRaw = typeof raw.type === "string" ? raw.type : String(raw.type ?? "");
    const type = normalizeType(typeRaw);
    const reason = raw.reason != null ? String(raw.reason) : undefined;
    const source = raw.source != null ? String(raw.source) : undefined;
    const projectName = raw.projectName != null ? String(raw.projectName).trim() : undefined;

    if (!shareholderName) {
      errors.push({ row: rowNumber, message: `Coluna "acionista" ausente ou vazia` });
      return;
    }
    if (!date) {
      errors.push({ row: rowNumber, message: `Coluna "data" ausente ou inválida: "${raw.date}"` });
      return;
    }
    if (amount === undefined || amount <= 0) {
      errors.push({ row: rowNumber, message: `Coluna "valor" ausente ou inválida (deve ser positivo): "${raw.amount}"` });
      return;
    }
    if (!type) {
      errors.push({
        row: rowNumber,
        message: `Coluna "tipo" inválida: "${raw.type}". Esperado: APORTE, DIVIDENDO ou ADMINISTRACAO`,
      });
      return;
    }

    validRows.push({ rowNumber, shareholderName, date, amount, type: type as "APORTE" | "DIVIDENDO" | "ADMINISTRACAO", reason, source, projectName });
  });

  return { validRows, errors, totalRows: rawRows.length };
}

export function parseAndValidate(buffer: Buffer | ArrayBuffer): ParseResult {
  const rawRows = parseWorkbookToRawRows(buffer);
  return validateRows(rawRows);
}

export interface NamedEntity {
  id: string;
  name: string;
}

export interface ResolvedShareholderTxRow extends ParsedShareholderTxRow {
  shareholderId: string;
  projectId?: string;
}

export interface ResolveResult {
  resolvedRows: ResolvedShareholderTxRow[];
  errors: RowError[];
}

function findByName(name: string, entities: NamedEntity[]): NamedEntity | undefined {
  const key = name.trim().toLowerCase();
  return entities.find((e) => e.name.trim().toLowerCase() === key);
}

/**
 * Resolve nomes de acionista (obrigatório) e projeto (opcional) para IDs do banco.
 * Linha sem acionista cadastrado é rejeitada; linha com projeto não encontrado mantém o erro mas descarta o vínculo.
 */
export function resolveShareholderRows(
  rows: ParsedShareholderTxRow[],
  shareholders: NamedEntity[],
  projects: NamedEntity[] = []
): ResolveResult {
  const resolvedRows: ResolvedShareholderTxRow[] = [];
  const errors: RowError[] = [];

  for (const row of rows) {
    const shareholder = findByName(row.shareholderName, shareholders);
    if (!shareholder) {
      errors.push({
        row: row.rowNumber,
        message: `Acionista "${row.shareholderName}" não encontrado. Cadastrados: ${shareholders.map((s) => s.name).join(", ")}`,
      });
      continue;
    }

    let projectId: string | undefined;
    if (row.projectName) {
      const project = findByName(row.projectName, projects);
      if (!project) {
        errors.push({ row: row.rowNumber, message: `Projeto "${row.projectName}" não encontrado — lançamento será salvo sem vínculo de projeto` });
      } else {
        projectId = project.id;
      }
    }

    resolvedRows.push({ ...row, shareholderId: shareholder.id, projectId });
  }

  return { resolvedRows, errors };
}
