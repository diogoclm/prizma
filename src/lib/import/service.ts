import { prisma } from "@/lib/db/client";
import type { ParsedCashFlowRow, ParseResult, RowError } from "./types";

export interface ImportResult {
  importBatchId: string;
  inserted: number;
  errors: RowError[];
  status: "SUCCESS" | "PARTIAL" | "ERROR";
}

/**
 * Persiste os eventos válidos de uma ParseResult em uma transação atômica.
 * Se a transação falhar, nenhum evento é gravado e o ImportBatch fica como ERROR.
 */
export async function persistImport(
  projectId: string,
  fileName: string,
  parseResult: ParseResult,
  scenarioId?: string
): Promise<ImportResult> {
  const { validRows, errors, totalRows } = parseResult;

  // Cria o batch antes — se a transação falhar, atualizamos o status para ERROR.
  const batch = await prisma.importBatch.create({
    data: {
      projectId,
      fileName,
      rowCount: totalRows,
      errorCount: errors.length,
      errors: errors.length > 0 ? JSON.parse(JSON.stringify(errors)) : undefined,
      status: "PENDING",
    },
  });

  if (validRows.length === 0) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "ERROR" },
    });
    return { importBatchId: batch.id, inserted: 0, errors, status: "ERROR" };
  }

  try {
    await prisma.$transaction(
      validRows.map((row) =>
        prisma.cashFlowEvent.create({
          data: {
            projectId,
            date: row.date,
            amount: row.amount,
            type: row.type,
            origin: row.origin,
            description: row.description,
            scenarioId: scenarioId ?? null,
            importId: batch.id,
          },
        })
      )
    );

    const status = errors.length > 0 ? "PARTIAL" : "SUCCESS";
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status },
    });

    return { importBatchId: batch.id, inserted: validRows.length, errors, status };
  } catch (err) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: "ERROR" },
    });
    throw err;
  }
}

/** Lista os batches de importação de um projeto, mais recentes primeiro. */
export async function listImportBatches(projectId: string) {
  return prisma.importBatch.findMany({
    where: { projectId },
    orderBy: { importedAt: "desc" },
    select: {
      id: true,
      fileName: true,
      importedAt: true,
      rowCount: true,
      errorCount: true,
      status: true,
    },
  });
}
