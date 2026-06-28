export interface CashFlow {
  date: Date;
  amount: number; // positivo = entrada; negativo = saída
}

export interface XirrResult {
  irr: number;       // taxa anual decimal (0.15 = 15% a.a.)
  converged: boolean;
}

export interface ProjectMetrics {
  irr: XirrResult;
  moic: number;       // múltiplo do capital investido (total retornado / total aportado)
  tvpi: number;       // Total Value to Paid-In
  dpi: number;        // Distributions to Paid-In
  rvpi: number;       // Residual Value to Paid-In
  totalInvested: number;
  totalDistributed: number;
  residualValue: number;
}
