interface PLProjectLike {
  liquidCashGen: number;
  liquidCashGenPct: number;
  officeDiscount: number;
  phasePct: number;
}

interface PLYearLike {
  averageSalary: number;
  salaryMultiplier: number;
  amountPaid: number;
  projects: PLProjectLike[];
}

export interface PLYearSummary {
  teto: number;
  amountPaid: number;
  pctOfTeto: number | null; // null quando teto = 0
  totalLiquidCashGen: number;
  totalBaseCalculo: number; // soma de (liquidCashGen * liquidCashGenPct - officeDiscount) * phasePct por projeto
}

export function calcPLProjectBase(project: PLProjectLike): number {
  return (project.liquidCashGen * project.liquidCashGenPct - project.officeDiscount) * project.phasePct;
}

export function calcPLYearSummary(plYear: PLYearLike): PLYearSummary {
  const teto = plYear.averageSalary * plYear.salaryMultiplier;
  const totalLiquidCashGen = plYear.projects.reduce((s, p) => s + p.liquidCashGen, 0);
  const totalBaseCalculo = plYear.projects.reduce((s, p) => s + calcPLProjectBase(p), 0);

  return {
    teto,
    amountPaid: plYear.amountPaid,
    pctOfTeto: teto > 0 ? plYear.amountPaid / teto : null,
    totalLiquidCashGen,
    totalBaseCalculo,
  };
}
