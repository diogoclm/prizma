import { NextRequest, NextResponse } from "next/server";
import { parseAndValidate } from "@/lib/import/parser";

/**
 * POST /api/projects/:projectId/imports/preview
 * Recebe um arquivo (multipart/form-data, campo "file") e retorna
 * a pré-visualização das linhas válidas + erros, SEM gravar no banco.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  await params; // projectId disponível mas não necessário no preview

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = parseAndValidate(buffer);

  return NextResponse.json({
    totalRows: result.totalRows,
    validCount: result.validRows.length,
    errorCount: result.errors.length,
    errors: result.errors,
    preview: result.validRows.slice(0, 20).map((r) => ({
      row: r.rowNumber,
      date: r.date.toISOString().split("T")[0],
      amount: r.amount,
      type: r.type,
      origin: r.origin,
      description: r.description ?? null,
    })),
  });
}
