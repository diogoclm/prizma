import { describe, it, expect } from "vitest";
import { coerceAmount, coerceDate } from "../coerce";

describe("coerceAmount", () => {
  it("aceita decimal US simples", () => {
    expect(coerceAmount("1234.56")).toBe(1234.56);
  });

  it("aceita milhar US com decimal (1,234.56)", () => {
    expect(coerceAmount("1,234.56")).toBe(1234.56);
  });

  it("aceita formato BR (1.234,56)", () => {
    expect(coerceAmount("1.234,56")).toBe(1234.56);
  });

  it("trata ponto isolado com 3 dígitos como milhar BR (1.234)", () => {
    expect(coerceAmount("1.234")).toBe(1234);
  });

  it("aceita múltiplos separadores de milhar (1.234.567)", () => {
    expect(coerceAmount("1.234.567")).toBe(1234567);
  });

  it("aceita number diretamente", () => {
    expect(coerceAmount(500)).toBe(500);
  });

  it("aceita prefixo R$", () => {
    expect(coerceAmount("R$ 1.500,00")).toBe(1500);
  });

  it("retorna undefined para string vazia ou inválida", () => {
    expect(coerceAmount("")).toBeUndefined();
    expect(coerceAmount("abc")).toBeUndefined();
  });
});

describe("coerceDate", () => {
  it("constrói data em UTC a partir de string ISO", () => {
    const d = coerceDate("2024-03-15");
    expect(d?.getUTCFullYear()).toBe(2024);
    expect(d?.getUTCMonth()).toBe(2);
    expect(d?.getUTCDate()).toBe(15);
    expect(d?.getUTCHours()).toBe(0);
  });

  it("constrói data em UTC a partir de string BR", () => {
    const d = coerceDate("15/03/2024");
    expect(d?.getUTCFullYear()).toBe(2024);
    expect(d?.getUTCMonth()).toBe(2);
    expect(d?.getUTCDate()).toBe(15);
    expect(d?.getUTCHours()).toBe(0);
  });
});
