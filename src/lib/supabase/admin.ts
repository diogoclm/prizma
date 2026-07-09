import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave secreta — SOMENTE em rotas de servidor.
 * Usado para gestão de usuários (listar, criar, alterar papel, remover).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
