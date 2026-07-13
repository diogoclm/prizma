import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

/** DELETE /api/admin-balance/manual/:id — remove projeto manual do saldo de administração. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  await prisma.adminManualProject.delete({ where: { id: entryId } });
  return NextResponse.json({ message: "Removido com sucesso" });
}
