-- AlterTable
ALTER TABLE "shareholder_transactions" ADD COLUMN     "projectId" TEXT;

-- DropTable
DROP TABLE "project_admin_receivables";

-- CreateIndex
CREATE INDEX "shareholder_transactions_projectId_idx" ON "shareholder_transactions"("projectId");

-- AddForeignKey
ALTER TABLE "shareholder_transactions" ADD CONSTRAINT "shareholder_transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

