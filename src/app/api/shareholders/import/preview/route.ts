import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { parseAndValidate, resolveShareholderRows } from "@/lib/societario/importParser";

/**
 * POST /api/shareholders/import/preview
 * Recebe planilha (multipart/form-data, campo "file"), retorna pré-visualização
 * com acionista/projeto já resolvidos por nome, SEM gravar no banco.
 */
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const buffer = Buffer.from(await (file as File).arrayBuffer());
  const parsed = parseAndValidate(buffer);

  const [shareholders, projects] = await Promise.all([
    prisma.shareholder.findMany({ select: { id: true, name: true } }),
    prisma.project.findMany({ select: { id: true, name: true } }),
  ]);

  const { resolvedRows, errors: resolveErrors } = resolveShareholderRows(parsed.validRows, shareholders, projects);
  const errors = [...parsed.errors, ...resolveErrors];

  return NextResponse.json({
    totalRows: parsed.totalRows,
    validCount: resolvedRows.length,
    errorCount: errors.length,
    errors,
    preview: resolvedRows.slice(0, 20).map((r) => ({
      row: r.rowNumber,
      shareholderName: r.shareholderName,
      date: r.date.toISOString().split("T")[0],
      amount: r.amount,
      type: r.type,
      reason: r.reason ?? null,
      source: r.source ?? null,
      projectName: r.projectId ? r.projectName : null,
    })),
  });
}
