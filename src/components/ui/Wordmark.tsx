interface WordmarkProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}

const SIZES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function Wordmark({ size = "md", showTagline = false, className = "" }: WordmarkProps) {
  return (
    <div className={className}>
      <span className={`font-bold tracking-tight text-prizma-900 ${SIZES[size]}`}>
        PRIZMA
      </span>
      {showTagline && (
        <p className="text-prizma-400 text-[10px] uppercase tracking-wider mt-0.5">
          Investimentos e Participações
        </p>
      )}
    </div>
  );
}
