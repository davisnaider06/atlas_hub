-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "calComBookingUid",
ADD COLUMN     "assignedToId" TEXT NOT NULL,
ADD COLUMN     "googleCalendarId" TEXT,
ADD COLUMN     "googleEventId" TEXT;

-- CreateIndex
CREATE INDEX "Appointment_assignedToId_idx" ON "Appointment"("assignedToId");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

