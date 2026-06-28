interface MetricCardProps {
  label: string;
  value: string | number | null;
  sub?: string;
  highlight?: "positive" | "negative" | "neutral";
  children?: React.ReactNode;
}

function sizeForLength(text: string): string {
  if (text.length > 18) return "text-base";
  if (text.length > 13) return "text-lg";
  if (text.length > 9) return "text-xl";
  return "text-2xl";
}

export function MetricCard({ label, value, sub, highlight = "neutral", children }: MetricCardProps) {
  const colorMap = {
    positive: "text-positive",
    negative: "text-negative",
    neutral: "text-prizma-900",
  };

  const displayValue = value ?? "—";
  const sizeClass = sizeForLength(String(displayValue));

  return (
    <div className="bg-white border border-prizma-300 rounded-lg p-5 text-center min-w-0 overflow-hidden">
      <p className="text-xs text-prizma-400 uppercase tracking-wide font-medium truncate">{label}</p>
      <p className={`font-bold mt-1 whitespace-nowrap ${sizeClass} ${colorMap[highlight]}`}>
        {displayValue}
      </p>
      {sub && <p className="text-xs text-prizma-400 mt-1 truncate">{sub}</p>}
      {children}
    </div>
  );
}
