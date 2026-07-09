import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { roleFromMetadata } from "@/lib/auth/roles";

const createSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  role: z.enum(["ADMIN", "ANALISTA"]),
});

/** GET /api/users — lista usuários com papel (só admin). */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: roleFromMetadata(u.app_metadata),
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
  }));

  return NextResponse.json(users);
}

/** POST /api/users — cria usuário com papel (só admin). */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    app_metadata: { role: parsed.data.role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(
    { id: data.user.id, email: data.user.email, role: parsed.data.role },
    { status: 201 }
  );
}
