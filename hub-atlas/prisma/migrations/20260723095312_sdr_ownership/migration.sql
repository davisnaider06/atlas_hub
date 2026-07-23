-- AlterTable: dono (SDR) no contato
ALTER TABLE "Contact" ADD COLUMN "ownerId" TEXT;

-- AlterTable: meta e comissão do usuário
ALTER TABLE "User" ADD COLUMN "salesTargetCents" INTEGER NOT NULL DEFAULT 1000000;
ALTER TABLE "User" ADD COLUMN "commissionPercent" INTEGER;

-- CreateIndex
CREATE INDEX "Contact_ownerId_idx" ON "Contact"("ownerId");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: atribui os contatos sem dono ao sócio mais antigo (se houver).
-- Numa base nova sem OWNER o subselect é NULL e o UPDATE é no-op.
UPDATE "Contact"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "role" = 'OWNER' ORDER BY "createdAt" ASC LIMIT 1)
WHERE "ownerId" IS NULL;
