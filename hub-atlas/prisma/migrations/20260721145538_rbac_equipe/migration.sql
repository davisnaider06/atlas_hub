-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'OWNER';
ALTER TYPE "Role" ADD VALUE 'MEMBER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "invitedBy" TEXT,
ALTER COLUMN "clerkId" DROP NOT NULL;

