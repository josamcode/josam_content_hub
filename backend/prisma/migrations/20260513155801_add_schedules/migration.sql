-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('scheduled', 'processing', 'published', 'failed', 'cancelled', 'manual_pending', 'manual_done');

-- CreateEnum
CREATE TYPE "PublishMode" AS ENUM ('auto', 'manual', 'reminder');

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "platform_post_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'scheduled',
    "publish_mode" "PublishMode" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schedules_platform_post_id_key" ON "schedules"("platform_post_id");

-- CreateIndex
CREATE INDEX "schedules_scheduled_at_idx" ON "schedules"("scheduled_at");

-- CreateIndex
CREATE INDEX "schedules_status_idx" ON "schedules"("status");

-- CreateIndex
CREATE INDEX "schedules_publish_mode_idx" ON "schedules"("publish_mode");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_platform_post_id_fkey" FOREIGN KEY ("platform_post_id") REFERENCES "platform_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
