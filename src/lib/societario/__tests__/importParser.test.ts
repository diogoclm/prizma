import { describe, it, expect } from "vitest";
import { validateRows, resolveShareholderRows, type RawRow } from "../importParser";

describe("validateRows", () => {
  it("valida linha completa e correta", () => {
    const raw: RawRow[] = [
      { shareholderName: "José Ricardo", date: "2024-03-15", amount: 50000, type: "APORTE", reason: "Aporte inicial", source: "Conta PJ" },
    ];
    const result = validateRows(raw);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0].shareholderName).toBe("José Ricardo");
    expect(result.validRows[0].type).toBe("APORTE");
  });

  it("aceita aliases de tipo sem acento/minúsculo", () => {
    const raw: RawRow[] = [
      { shareholderName: "Marina", date: "2024-03-15", amount: 1000, type: "administração" },
      { shareholderName: "Marina", date: "2024-03-16", amount: 1000, type: "dividendo" },
    ];
    const result = validateRows(raw);
    expect(result.errors).toHaveLength(0);
    expect(result.validRows[0].type).toBe("ADMINISTRACAO");
    expect(result.validRows[1].type).toBe("DIVIDENDO");
  });

  it("rejeita linha sem acionista", () => {
    const raw: RawRow[] = [{ date: "2024-03-15", amount: 1000, type: "APORTE" }];
    const result = validateRows(raw);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/acionista/);
  });

  it("rejeita valor negativo ou zero", () => {
    const raw: RawRow[] = [
      { shareholderName: "JR", date: "2024-03-15", amount: -100, type: "APORTE" },
      { shareholderName: "JR", date: "2024-03-15", amount: 0, type: "APORTE" },
    ];
    const result = validateRows(raw);
    expect(result.errors).toHaveLength(2);
  });

  it("rejeita tipo inválido", () => {
    const raw: RawRow[] = [{ shareholderName: "JR", date: "2024-03-15", amount: 100, type: "SAQUE" }];
    const result = validateRows(raw);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/tipo/);
  });

  it("captura projeto opcional", () => {
    const raw: RawRow[] = [
      { shareholderName: "JR", date: "2024-03-15", amount: 100, type: "ADMINISTRACAO", projectName: "SPE Alpha" },
    ];
    const result = validateRows(raw);
    expect(result.validRows[0].projectName).toBe("SPE Alpha");
  });
});

describe("resolveShareholderRows", () => {
  const shareholders = [{ id: "sh-jr", name: "José Ricardo" }, { id: "sh-marina", name: "Marina" }];
  const projects = [{ id: "p1", name: "SPE Alpha" }];

  it("resolve acionista e projeto por nome (case-insensitive)", () => {
    const rows = validateRows([
      { shareholderName: "josé ricardo", date: "2024-03-15", amount: 100, type: "ADMINISTRACAO", projectName: "spe alpha" },
    ]).validRows;
    const result = resolveShareholderRows(rows, shareholders, projects);
    expect(result.errors).toHaveLength(0);
    expect(result.resolvedRows[0].shareholderId).toBe("sh-jr");
    expect(result.resolvedRows[0].projectId).toBe("p1");
  });

  it("rejeita acionista não cadastrado", () => {
    const rows = validateRows([
      { shareholderName: "Desconhecido", date: "2024-03-15", amount: 100, type: "APORTE" },
    ]).validRows;
    const result = resolveShareholderRows(rows, shareholders, projects);
    expect(result.resolvedRows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/não encontrado/);
  });

  it("mantém lançamento sem vínculo quando projeto não é encontrado, mas avisa", () => {
    const rows = validateRows([
      { shareholderName: "Marina", date: "2024-03-15", amount: 100, type: "ADMINISTRACAO", projectName: "Inexistente" },
    ]).validRows;
    const result = resolveShareholderRows(rows, shareholders, projects);
    expect(result.resolvedRows).toHaveLength(1);
    expect(result.resolvedRows[0].projectId).toBeUndefined();
    expect(result.errors).toHaveLength(1);
  });

  it("não exige projeto quando ausente", () => {
    const rows = validateRows([{ shareholderName: "Marina", date: "2024-03-15", amount: 100, type: "DIVIDENDO" }]).validRows;
    const result = resolveShareholderRows(rows, shareholders, projects);
    expect(result.resolvedRows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });
});
