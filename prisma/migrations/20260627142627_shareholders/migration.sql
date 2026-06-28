-- CreateEnum
CREATE TYPE "ShareholderTxType" AS ENUM ('APORTE', 'DIVIDENDO', 'ADMINISTRACAO');

-- CreateTable
CREATE TABLE "shareholders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "adminPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shareholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shareholder_transactions" (
    "id" TEXT NOT NULL,
    "shareholderId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "ShareholderTxType" NOT NULL,
    "reason" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shareholder_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_admin_receivables" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "expectedTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receivedTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_admin_receivables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shareholder_transactions_shareholderId_date_idx" ON "shareholder_transactions"("shareholderId", "date");

-- AddForeignKey
ALTER TABLE "shareholder_transactions" ADD CONSTRAINT "shareholder_transactions_shareholderId_fkey" FOREIGN KEY ("shareholderId") REFERENCES "shareholders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
