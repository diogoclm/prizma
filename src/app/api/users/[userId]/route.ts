import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/requireAdmin";

const updateSchema = z.object({
  role: z.enum(["ADMIN", "ANALISTA"]),
});

/** PATCH /api/users/:id — altera papel do usuário (só admin). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Admin não pode rebaixar a si mesmo — evita perder o último acesso à gestão.
  if (userId === auth.userId && parsed.data.role !== "ADMIN") {
    return NextResponse.json({ error: "Você não pode remover seu próprio papel de administrador" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role: parsed.data.role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ id: data.user.id, email: data.user.email, role: parsed.data.role });
}

/** DELETE /api/users/:id — remove usuário (só admin). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { userId } = await params;

  if (userId === auth.userId) {
    return NextResponse.json({ error: "Você não pode remover a própria conta" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: "Usuário removido" });
}
