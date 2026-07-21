-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_contactId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "contactId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "GoogleAccount" ADD COLUMN     "syncToken" TEXT,
ALTER COLUMN "calendarId" DROP NOT NULL,
ALTER COLUMN "calendarId" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

