-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'done', 'cancelled', 'missed');

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "remind_at" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reminders_schedule_id_key" ON "reminders"("schedule_id");

-- CreateIndex
CREATE INDEX "reminders_remind_at_idx" ON "reminders"("remind_at");

-- CreateIndex
CREATE INDEX "reminders_status_idx" ON "reminders"("status");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
