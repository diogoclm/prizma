-- CreateEnum
CREATE TYPE "AcquisitionType" AS ENUM ('COMPRA', 'PERMUTA');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "acquisitionType" "AcquisitionType",
ADD COLUMN     "permutaDetails" TEXT;
