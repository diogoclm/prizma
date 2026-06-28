export type ShareholderTxType = "APORTE" | "DIVIDENDO" | "ADMINISTRACAO";

export interface ShareholderTxInput {
  amount: number;
  type: ShareholderTxType;
}

export interface ShareholderSummary {
  totalAportado: number;
  totalDividendos: number;
  totalAdministracao: number;
  saldoCapital: number; // aportado - dividendos → capital aportado ainda não devolvido via dividendos. NÃO inclui administração (é taxa de serviço, conta separada).
}

/**
 * Resume os lançamentos de um acionista por tipo.
 * APORTE = capital que entrou (acionista → Prizma).
 * DIVIDENDO = devolução de capital/lucro (Prizma → acionista) — entra no saldo de capital.
 * ADMINISTRACAO = taxa de serviço (Prizma → acionista) — conta distinta, não mistura com capital.
 */
export function calcShareholderSummary(transactions: ShareholderTxInput[]): ShareholderSummary {
  const totalAportado = transactions
    .filter((t) => t.type === "APORTE")
    .reduce((s, t) => s + t.amount, 0);

  const totalDividendos = transactions
    .filter((t) => t.type === "DIVIDENDO")
    .reduce((s, t) => s + t.amount, 0);

  const totalAdministracao = transactions
    .filter((t) => t.type === "ADMINISTRACAO")
    .reduce((s, t) => s + t.amount, 0);

  return {
    totalAportado,
    totalDividendos,
    totalAdministracao,
    saldoCapital: totalAportado - totalDividendos,
  };
}

export interface AdminProjectInput {
  projectId: string;
  projectName: string;
  lucro: number; // retornado - investido (pode ser negativo)
}

export interface AdminAdministratorInput {
  shareholderId: string;
  name: string;
  adminPct: number; // fração 0-1
}

export interface AdminPaymentInput {
  projectId: string;
  shareholderId: string;
  amount: number;
}

export interface AdminByAdministrator {
  shareholderId: string;
  name: string;
  adminPct: number;
  expected: number;
  paid: number;
  balance: number;
}

export interface AdminByProjectResult {
  projectId: string;
  projectName: string;
  lucro: number;
  lucroClamped: number;
  expectedTotal: number;
  paidTotal: number;
  balanceTotal: number;
  byAdministrator: AdminByAdministrator[];
}

/**
 * Calcula o saldo de administração automático por projeto entregue.
 * lucro negativo é zerado (administração não cobra sobre prejuízo).
 * Apenas acionistas com adminPct > 0 entram na quebra por administrador.
 */
export function calcAdminByProject(
  projects: AdminProjectInput[],
  administrators: AdminAdministratorInput[],
  payments: AdminPaymentInput[]
): AdminByProjectResult[] {
  const adminsWithPct = administrators.filter((a) => a.adminPct > 0);

  return projects.map((project) => {
    const lucroClamped = Math.max(project.lucro, 0);

    const byAdministrator: AdminByAdministrator[] = adminsWithPct.map((admin) => {
      const expected = admin.adminPct * lucroClamped;
      const paid = payments
        .filter((p) => p.projectId === project.projectId && p.shareholderId === admin.shareholderId)
        .reduce((s, p) => s + p.amount, 0);
      return {
        shareholderId: admin.shareholderId,
        name: admin.name,
        adminPct: admin.adminPct,
        expected,
        paid,
        balance: expected - paid,
      };
    });

    const expectedTotal = byAdministrator.reduce((s, a) => s + a.expected, 0);
    const paidTotal = byAdministrator.reduce((s, a) => s + a.paid, 0);

    return {
      projectId: project.projectId,
      projectName: project.projectName,
      lucro: project.lucro,
      lucroClamped,
      expectedTotal,
      paidTotal,
      balanceTotal: expectedTotal - paidTotal,
      byAdministrator,
    };
  });
}
