-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('HOTELEIRO', 'IMOBILIARIO');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('LANDBANKING', 'LANCAMENTO', 'CONSTRUCAO', 'ENTREGUE', 'OPERACAO_CONTINUA', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('APORTE', 'DISTRIBUICAO', 'RECEBIMENTO_VENDA', 'CUSTO', 'VALOR_TERMINAL');

-- CreateEnum
CREATE TYPE "CashFlowOrigin" AS ENUM ('REALIZADO', 'PROJETADO');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "branch" "Branch" NOT NULL,
    "stage" "ProjectStage" NOT NULL,
    "ownershipPct" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "description" TEXT,
    "launchDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "closureDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_events" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "origin" "CashFlowOrigin" NOT NULL,
    "description" TEXT,
    "scenarioId" TEXT,
    "importId" TEXT,

    CONSTRAINT "cash_flow_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baselines" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL,
    "frozenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFrozen" BOOLEAN NOT NULL DEFAULT false,
    "assumptionVgv" DOUBLE PRECISION,
    "assumptionCost" DOUBLE PRECISION,
    "assumptionNoi" DOUBLE PRECISION,
    "assumptionNotes" TEXT,
    "projectedIrr" DOUBLE PRECISION,
    "projectedMoic" DOUBLE PRECISION,
    "projectedNpv" DOUBLE PRECISION,
    "projectedCashFlows" JSONB,

    CONSTRAINT "baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "valuations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "method" TEXT,
    "notes" TEXT,

    CONSTRAINT "valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_batches" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_flow_events_projectId_date_idx" ON "cash_flow_events"("projectId", "date");

-- CreateIndex
CREATE INDEX "cash_flow_events_scenarioId_idx" ON "cash_flow_events"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "baselines_projectId_version_key" ON "baselines"("projectId", "version");

-- CreateIndex
CREATE INDEX "valuations_projectId_date_idx" ON "valuations"("projectId", "date");

-- AddForeignKey
ALTER TABLE "cash_flow_events" ADD CONSTRAINT "cash_flow_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_events" ADD CONSTRAINT "cash_flow_events_importId_fkey" FOREIGN KEY ("importId") REFERENCES "import_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baselines" ADD CONSTRAINT "baselines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "valuations" ADD CONSTRAINT "valuations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
