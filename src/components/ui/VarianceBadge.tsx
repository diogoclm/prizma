interface VarianceBadgeProps {
  variancePp: number | null; // pontos percentuais
}

export function VarianceBadge({ variancePp }: VarianceBadgeProps) {
  if (variancePp === null) return <span className="text-prizma-400 text-xs">sem baseline</span>;

  const isPositive = variancePp >= 0;
  const sign = isPositive ? "+" : "";
  const color = isPositive
    ? "bg-positive-bg text-positive border-positive-border"
    : "bg-negative-bg text-negative border-negative-border";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-mono ${color}`}>
      {sign}{variancePp.toFixed(1)} p.p.
    </span>
  );
}
