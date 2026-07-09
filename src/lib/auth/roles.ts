export type Role = "ADMIN" | "ANALISTA";

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  ANALISTA: "Analista",
};

/**
 * Extrai o papel do app_metadata do usuário Supabase.
 * Sem papel definido → ANALISTA (nega por padrão; ADMIN é sempre atribuição explícita).
 */
export function roleFromMetadata(appMetadata: Record<string, unknown> | undefined | null): Role {
  return appMetadata?.role === "ADMIN" ? "ADMIN" : "ANALISTA";
}

/**
 * Papel mínimo exigido para um caminho, ou null quando basta estar autenticado.
 * ADMIN exclusivo: Participação de Lucros e gestão de usuários.
 */
export function requiredRoleFor(pathname: string): Role | null {
  const adminOnly = ["/dashboard/pl", "/api/pl", "/dashboard/usuarios", "/api/users"];
  if (adminOnly.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "ADMIN";
  }
  return null;
}

export function canAccess(role: Role, pathname: string): boolean {
  const required = requiredRoleFor(pathname);
  return required === null || role === required;
}
