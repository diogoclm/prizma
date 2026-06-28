import { NextRequest, NextResponse } from "next/server";
import { parseAndValidate } from "@/lib/import/parser";
import { persistImport, listImportBatches } from "@/lib/import/service";

/**
 * POST /api/projects/:projectId/imports
 * Faz parse, valida e GRAVA os eventos no banco (transação atômica).
 * Campo opcional "scenarioId" (form-data string) para reprojeções.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const formData = await req.formData();
  const file = formData.get("file");
  const scenarioId = formData.get("scenarioId");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const fileName = (file as File).name;
  const buffer = Buffer.from(await (file as File).arrayBuffer());

  const parseResult = parseAndValidate(buffer);

  if (parseResult.validRows.length === 0) {
    return NextResponse.json(
      {
        error: "Nenhuma linha válida encontrada. Verifique o formato da planilha.",
        errors: parseResult.errors,
      },
      { status: 422 }
    );
  }

  const result = await persistImport(
    projectId,
    fileName,
    parseResult,
    typeof scenarioId === "string" ? scenarioId : undefined
  );

  return NextResponse.json(result, { status: result.status === "ERROR" ? 500 : 200 });
}

/**
 * GET /api/projects/:projectId/imports
 * Lista o histórico de importações do projeto.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const batches = await listImportBatches(projectId);
  return NextResponse.json(batches);
}
