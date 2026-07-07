import * as XLSX from "xlsx";

/**
 * Datas são sempre construídas em UTC (meia-noite UTC do dia informado), nunca
 * no fuso local — evita que o dia exibido varie conforme o fuso do navegador/servidor.
 * fmtDate (src/lib/format.ts) deve formatar com timeZone: "UTC" para casar com isso.
 */
export function coerceDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // serial date do Excel
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  if (typeof value === "string") {
    // aceita ISO (2024-01-01) e BR (01/01/2024)
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])));
    }
    const brMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (brMatch) {
      return new Date(Date.UTC(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1])));
    }
    const fallback = new Date(value);
    return isNaN(fallback.getTime()) ? undefined : fallback;
  }
  return undefined;
}

/**
 * Aceita formato BR ("1.234,56" — ponto de milhar, vírgula decimal) e US
 * ("1,234.56" — vírgula de milhar, ponto decimal), inclusive sem separador de
 * milhar ("1234.56"). Quando vírgula e ponto aparecem juntos, o separador
 * decimal é o que vem por último na string (ex: em "1,234.56" o ponto vem
 * depois → decimal US; em "1.234,56" a vírgula vem depois → decimal BR).
 * Com um único tipo de separador, um ponto isolado só é tratado como milhar
 * quando o padrão é inequívoco (múltiplos grupos de 3, ex: "1.234.567", ou um
 * único grupo de exatamente 3 dígitos após o ponto, ex: "1.234").
 */
export function coerceAmount(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return undefined;

  let s = value.trim().replace(/R\$\s?/, "");
  if (s === "") return undefined;

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", "."); // BR: milhar=. decimal=,
    } else {
      s = s.replace(/,/g, ""); // US: milhar=, decimal=.
    }
  } else if (hasComma) {
    s = s.replace(",", "."); // BR sem milhar: só decimal
  } else if (hasDot) {
    const parts = s.split(".");
    const looksLikeThousands =
      parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3);
    if (looksLikeThousands) {
      s = s.replace(/\./g, "");
    }
  }

  const num = Number(s);
  return isNaN(num) ? undefined : num;
}
