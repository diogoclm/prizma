import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roleFromMetadata } from "./roles";

/**
 * Defesa em profundidade: o middleware já bloqueia /api/users para não-admin,
 * mas as rotas de gestão de usuários reconferem antes de usar a chave secreta.
 * Retorna o usuário logado, ou uma resposta de erro pronta.
 */
export async function requireAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) };
  }
  if (roleFromMetadata(user.app_metadata) !== "ADMIN") {
    return { ok: false, response: NextResponse.json({ error: "Acesso restrito ao administrador" }, { status: 403 }) };
  }
  return { ok: true, userId: user.id };
}
