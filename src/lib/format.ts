export function fmtPct(value: number | null, decimals = 1): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(decimals)}%`;
}

export function fmtMoic(value: number | null, decimals = 2): string {
  if (value === null) return "—";
  return `${value.toFixed(decimals)}x`;
}

export function fmtBrl(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}

export const STAGE_LABELS: Record<string, string> = {
  LANDBANKING: "Landbanking",
  LANCAMENTO: "Lançamento",
  CONSTRUCAO: "Construção",
  ENTREGUE: "Entregue",
  OPERACAO_CONTINUA: "Operação Contínua",
  ENCERRADO: "Encerrado",
};

export const STAGE_COLORS: Record<string, string> = {
  LANDBANKING: "text-prizma-500 bg-prizma-100",
  LANCAMENTO: "text-prizma-700 bg-prizma-200",
  CONSTRUCAO: "text-prizma-700 bg-prizma-200",
  ENTREGUE: "text-positive bg-positive-bg",
  OPERACAO_CONTINUA: "text-prizma-900 bg-prizma-200",
  ENCERRADO: "text-prizma-400 bg-prizma-100",
};
