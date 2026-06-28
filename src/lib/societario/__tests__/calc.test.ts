import { describe, it, expect } from "vitest";
import { calcShareholderSummary, calcAdminByProject } from "../calc";

describe("calcShareholderSummary", () => {
  it("soma aportes, dividendos e administração corretamente", () => {
    const s = calcShareholderSummary([
      { amount: 100_000, type: "APORTE" },
      { amount: 50_000, type: "APORTE" },
      { amount: 20_000, type: "DIVIDENDO" },
      { amount: 10_000, type: "ADMINISTRACAO" },
    ]);
    expect(s.totalAportado).toBe(150_000);
    expect(s.totalDividendos).toBe(20_000);
    expect(s.totalAdministracao).toBe(10_000);
    expect(s.saldoCapital).toBe(130_000); // 150k - 20k, administração NÃO entra
  });

  it("retorna zeros para acionista sem lançamentos", () => {
    const s = calcShareholderSummary([]);
    expect(s.totalAportado).toBe(0);
    expect(s.totalDividendos).toBe(0);
    expect(s.totalAdministracao).toBe(0);
    expect(s.saldoCapital).toBe(0);
  });

  it("saldo de capital pode ser negativo (recebeu mais dividendo do que aportou)", () => {
    const s = calcShareholderSummary([
      { amount: 10_000, type: "APORTE" },
      { amount: 30_000, type: "DIVIDENDO" },
    ]);
    expect(s.saldoCapital).toBe(-20_000);
  });

  it("acionista só com administração não afeta saldo de capital", () => {
    const s = calcShareholderSummary([
      { amount: 25_000, type: "ADMINISTRACAO" },
      { amount: 5_000, type: "ADMINISTRACAO" },
    ]);
    expect(s.totalAdministracao).toBe(30_000);
    expect(s.totalAportado).toBe(0);
    expect(s.saldoCapital).toBe(0); // administração é conta separada
  });
});

describe("calcAdminByProject", () => {
  const admins = [
    { shareholderId: "jr", name: "José Ricardo", adminPct: 0.25 },
    { shareholderId: "marina", name: "Marina", adminPct: 0.05 },
    { shareholderId: "priscila", name: "Priscila", adminPct: 0 },
  ];

  it("calcula esperado por projeto e por administrador com lucro positivo", () => {
    const result = calcAdminByProject(
      [{ projectId: "p1", projectName: "SPE Alpha", lucro: 1_000_000 }],
      admins,
      []
    );
    expect(result).toHaveLength(1);
    expect(result[0].expectedTotal).toBe(300_000); // 30% de 1M
    expect(result[0].paidTotal).toBe(0);
    expect(result[0].balanceTotal).toBe(300_000);

    const jr = result[0].byAdministrator.find((a) => a.shareholderId === "jr")!;
    expect(jr.expected).toBe(250_000);
    const marina = result[0].byAdministrator.find((a) => a.shareholderId === "marina")!;
    expect(marina.expected).toBe(50_000);
  });

  it("zera administração quando lucro é negativo", () => {
    const result = calcAdminByProject(
      [{ projectId: "p1", projectName: "SPE Beta", lucro: -500_000 }],
      admins,
      []
    );
    expect(result[0].lucroClamped).toBe(0);
    expect(result[0].expectedTotal).toBe(0);
    expect(result[0].balanceTotal).toBe(0);
  });

  it("subtrai pagamentos já feitos para cada administrador no projeto", () => {
    const result = calcAdminByProject(
      [{ projectId: "p1", projectName: "SPE Alpha", lucro: 1_000_000 }],
      admins,
      [
        { projectId: "p1", shareholderId: "jr", amount: 100_000 },
        { projectId: "p1", shareholderId: "jr", amount: 50_000 },
        { projectId: "p1", shareholderId: "marina", amount: 50_000 },
        { projectId: "p2", shareholderId: "jr", amount: 999_999 }, // outro projeto, não conta
      ]
    );
    const jr = result[0].byAdministrator.find((a) => a.shareholderId === "jr")!;
    expect(jr.paid).toBe(150_000);
    expect(jr.balance).toBe(100_000); // 250k - 150k
    const marina = result[0].byAdministrator.find((a) => a.shareholderId === "marina")!;
    expect(marina.paid).toBe(50_000);
    expect(marina.balance).toBe(0); // 50k - 50k
    expect(result[0].paidTotal).toBe(200_000);
    expect(result[0].balanceTotal).toBe(100_000);
  });

  it("exclui acionistas com adminPct zero da quebra por administrador", () => {
    const result = calcAdminByProject(
      [{ projectId: "p1", projectName: "SPE Alpha", lucro: 1_000_000 }],
      admins,
      []
    );
    expect(result[0].byAdministrator.find((a) => a.shareholderId === "priscila")).toBeUndefined();
  });

  it("soma dos administradores bate com o total do projeto", () => {
    const result = calcAdminByProject(
      [{ projectId: "p1", projectName: "SPE Alpha", lucro: 800_000 }],
      admins,
      [{ projectId: "p1", shareholderId: "jr", amount: 30_000 }]
    );
    const sumExpected = result[0].byAdministrator.reduce((s, a) => s + a.expected, 0);
    const sumPaid = result[0].byAdministrator.reduce((s, a) => s + a.paid, 0);
    expect(sumExpected).toBe(result[0].expectedTotal);
    expect(sumPaid).toBe(result[0].paidTotal);
  });

  it("retorna lista vazia para nenhum projeto", () => {
    expect(calcAdminByProject([], admins, [])).toEqual([]);
  });
});
