-- CreateEnum
CREATE TYPE "DocumentScope" AS ENUM ('CONTACT', 'INTERNAL');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('SCRIPT', 'PLANNING', 'SCOPE', 'CONTRACT', 'PROPOSAL', 'OTHER');

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_contactId_fkey";

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "gcsObjectKey",
ADD COLUMN     "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "scope" "DocumentScope" NOT NULL,
ADD COLUMN     "storageKey" TEXT NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "contactId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Document_scope_category_idx" ON "Document"("scope", "category");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

