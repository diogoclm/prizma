import { z } from "zod";

export const CASH_FLOW_TYPES = [
  "APORTE",
  "DISTRIBUICAO",
  "RECEBIMENTO_VENDA",
  "CUSTO",
  "VALOR_TERMINAL",
] as const;

export const CASH_FLOW_ORIGINS = ["REALIZADO", "PROJETADO"] as const;

// Aceita variações comuns de digitação (sem acento, minúsculo, etc.)
const TYPE_ALIASES: Record<string, string> = {
  aporte: "APORTE",
  distribuicao: "DISTRIBUICAO",
  "distribuição": "DISTRIBUICAO",
  recebimentovenda: "RECEBIMENTO_VENDA",
  "recebimento_venda": "RECEBIMENTO_VENDA",
  "recebimento de venda": "RECEBIMENTO_VENDA",
  custo: "CUSTO",
  valorterminal: "VALOR_TERMINAL",
  "valor_terminal": "VALOR_TERMINAL",
  "valor terminal": "VALOR_TERMINAL",
};

const ORIGIN_ALIASES: Record<string, string> = {
  realizado: "REALIZADO",
  projetado: "PROJETADO",
  projetada: "PROJETADO",
};

export function normalizeType(raw: string): string | undefined {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return TYPE_ALIASES[key] ?? (CASH_FLOW_TYPES.includes(raw.toUpperCase() as never) ? raw.toUpperCase() : undefined);
}

export function normalizeOrigin(raw: string): string | undefined {
  const key = raw.trim().toLowerCase();
  return ORIGIN_ALIASES[key] ?? (CASH_FLOW_ORIGINS.includes(raw.toUpperCase() as never) ? raw.toUpperCase() : undefined);
}

export const cashFlowRowSchema = z.object({
  date: z.date({ invalid_type_error: "Data inválida" }),
  amount: z
    .number({ invalid_type_error: "Valor deve ser numérico" })
    .refine((v) => v !== 0, { message: "Valor não pode ser zero" }),
  type: z.enum(CASH_FLOW_TYPES, {
    errorMap: () => ({ message: `Tipo deve ser um de: ${CASH_FLOW_TYPES.join(", ")}` }),
  }),
  origin: z.enum(CASH_FLOW_ORIGINS, {
    errorMap: () => ({ message: `Origem deve ser uma de: ${CASH_FLOW_ORIGINS.join(", ")}` }),
  }),
  description: z.string().optional(),
});
