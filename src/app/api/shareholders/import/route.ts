import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { parseAndValidate, resolveShareholderRows } from "@/lib/societario/importParser";

/**
 * POST /api/shareholders/import
 * Faz parse, resolve acionista/projeto por nome e GRAVA os lançamentos no banco.
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

  if (resolvedRows.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma linha válida encontrada. Verifique o formato da planilha.", errors },
      { status: 422 }
    );
  }

  await prisma.$transaction(
    resolvedRows.map((row) =>
      prisma.shareholderTransaction.create({
        data: {
          shareholderId: row.shareholderId,
          projectId: row.projectId,
          date: row.date,
          amount: row.amount,
          type: row.type,
          reason: row.reason,
          source: row.source,
        },
      })
    )
  );

  return NextResponse.json({
    inserted: resolvedRows.length,
    errors,
    status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
  });
}
