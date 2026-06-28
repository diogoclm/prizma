interface GeometricMarkProps {
  variant?: "octahedron" | "prism" | "cube";
  className?: string;
}

/**
 * Sólidos wireframe da identidade visual Prizma (ver Brand Assets PDF).
 * Uso decorativo, discreto — opacidade baixa, nunca como elemento principal.
 */
export function GeometricMark({ variant = "octahedron", className = "" }: GeometricMarkProps) {
  const stroke = "currentColor";
  const common = { fill: "none", stroke, strokeWidth: 1 };

  if (variant === "cube") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <polygon points="20,30 60,20 90,35 50,45" {...common} />
        <polygon points="20,30 50,45 50,80 20,65" {...common} />
        <polygon points="50,45 90,35 90,70 50,80" {...common} />
      </svg>
    );
  }

  if (variant === "prism") {
    return (
      <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
        <polygon points="30,15 30,85 15,75 15,25" {...common} />
        <polygon points="30,15 70,15 85,25 30,85" {...common} />
        <line x1="30" y1="15" x2="15" y2="25" {...common} />
        <line x1="30" y1="85" x2="85" y2="25" {...common} />
        <line x1="70" y1="15" x2="85" y2="25" {...common} />
      </svg>
    );
  }

  // octahedron (padrão)
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points="50,10 85,50 50,55 15,50" {...common} />
      <polygon points="50,10 50,55 85,50" {...common} />
      <polygon points="50,55 15,50 50,90" {...common} />
      <polygon points="50,55 85,50 50,90" {...common} />
    </svg>
  );
}
