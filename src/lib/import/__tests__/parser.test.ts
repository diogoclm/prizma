import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseWorkbookToRawRows, validateRows, parseAndValidate } from "../parser";

/** Cria um buffer XLSX a partir de um array de objetos (simula planilha real). */
function makeXlsxBuffer(rows: object[]): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

describe("parseAndValidate — planilha válida", () => {
  it("importa linhas com cabeçalhos em português", () => {
    const buf = makeXlsxBuffer([
      { data: "2024-01-15", valor: -500000, tipo: "APORTE", origem: "REALIZADO", descricao: "Aporte inicial" },
      { data: "2025-06-01", valor: 750000, tipo: "RECEBIMENTO_VENDA", origem: "PROJETADO", descricao: "" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(2);
    expect(result.validRows[0].amount).toBe(-500000);
    expect(result.validRows[0].type).toBe("APORTE");
    expect(result.validRows[1].type).toBe("RECEBIMENTO_VENDA");
  });

  it("aceita cabeçalhos em inglês", () => {
    const buf = makeXlsxBuffer([
      { date: "2024-03-01", amount: -100000, type: "APORTE", origin: "REALIZADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
  });

  it("aceita variações de tipo com acento e minúsculo", () => {
    const buf = makeXlsxBuffer([
      { data: "2024-01-01", valor: 80000, tipo: "distribuição", origem: "REALIZADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].type).toBe("DISTRIBUICAO");
  });

  it("aceita data no formato BR (DD/MM/AAAA)", () => {
    const buf = makeXlsxBuffer([
      { data: "15/03/2024", valor: -200000, tipo: "APORTE", origem: "REALIZADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(0);
    const d = result.validRows[0].date;
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(2); // março = 2 (0-indexed)
    expect(d.getDate()).toBe(15);
  });

  it("aceita valor como string no formato BR (1.500,00)", () => {
    const buf = makeXlsxBuffer([
      { data: "2024-01-01", valor: "1.500,00", tipo: "DISTRIBUICAO", origem: "REALIZADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].amount).toBe(1500);
  });
});

describe("parseAndValidate — erros por linha", () => {
  it("reporta erro para linha com tipo inválido sem corromper as demais", () => {
    const buf = makeXlsxBuffer([
      { data: "2024-01-01", valor: -100000, tipo: "APORTE", origem: "REALIZADO" },
      { data: "2024-06-01", valor: 50000, tipo: "TIPO_INVALIDO", origem: "REALIZADO" },
      { data: "2025-01-01", valor: 80000, tipo: "DISTRIBUICAO", origem: "PROJETADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(3); // linha 3 (cabeçalho=1, primeira=2, segunda=3)
    expect(result.validRows).toHaveLength(2);
  });

  it("reporta erro para data ausente", () => {
    const buf = makeXlsxBuffer([
      { data: "", valor: -100000, tipo: "APORTE", origem: "REALIZADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/data/i);
  });

  it("reporta erro para valor zero", () => {
    const buf = makeXlsxBuffer([
      { data: "2024-01-01", valor: 0, tipo: "APORTE", origem: "REALIZADO" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/zero/i);
  });

  it("retorna totalRows correto incluindo linhas com erro", () => {
    const buf = makeXlsxBuffer([
      { data: "2024-01-01", valor: -100000, tipo: "APORTE", origem: "REALIZADO" },
      { data: "INVALIDO", valor: "INVALIDO", tipo: "X", origem: "Y" },
    ]);
    const result = parseAndValidate(buf);
    expect(result.totalRows).toBe(2);
    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
});

describe("parseAndValidate — planilha vazia", () => {
  it("retorna listas vazias sem erro", () => {
    const buf = makeXlsxBuffer([]);
    const result = parseAndValidate(buf);
    expect(result.totalRows).toBe(0);
    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
