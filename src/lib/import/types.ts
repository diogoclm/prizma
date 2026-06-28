export type RawRow = Record<string, unknown>;

export interface ParsedCashFlowRow {
  rowNumber: number; // 1-based, considerando o cabeçalho como linha 1
  date: Date;
  amount: number;
  type: "APORTE" | "DISTRIBUICAO" | "RECEBIMENTO_VENDA" | "CUSTO" | "VALOR_TERMINAL";
  origin: "REALIZADO" | "PROJETADO";
  description?: string;
}

export interface RowError {
  row: number;
  message: string;
}

export interface ParseResult {
  validRows: ParsedCashFlowRow[];
  errors: RowError[];
  totalRows: number;
}
