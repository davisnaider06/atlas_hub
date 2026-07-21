-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('LEAD', 'CLIENT');

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "contractValueCents" INTEGER,
ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "type" "ContactType" NOT NULL DEFAULT 'LEAD';

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceMinCents" INTEGER,
    "priceMaxCents" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

