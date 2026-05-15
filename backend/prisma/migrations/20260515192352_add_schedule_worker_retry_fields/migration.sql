-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "attempt_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_attempt_at" TIMESTAMP(3),
ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "next_attempt_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "schedules_status_next_attempt_at_idx" ON "schedules"("status", "next_attempt_at");
