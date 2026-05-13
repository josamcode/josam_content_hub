-- CreateEnum
CREATE TYPE "PublishAttemptStatus" AS ENUM ('success', 'failed', 'skipped', 'manual_completed', 'cancelled');

-- CreateTable
CREATE TABLE "publish_attempts" (
    "id" TEXT NOT NULL,
    "platform_post_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "platform" "Platform" NOT NULL,
    "status" "PublishAttemptStatus" NOT NULL,
    "publish_mode" "PublishMode" NOT NULL,
    "error_message" TEXT,
    "response_payload" JSONB,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "publish_attempts_platform_post_id_idx" ON "publish_attempts"("platform_post_id");

-- CreateIndex
CREATE INDEX "publish_attempts_schedule_id_idx" ON "publish_attempts"("schedule_id");

-- CreateIndex
CREATE INDEX "publish_attempts_platform_idx" ON "publish_attempts"("platform");

-- CreateIndex
CREATE INDEX "publish_attempts_status_idx" ON "publish_attempts"("status");

-- CreateIndex
CREATE INDEX "publish_attempts_attempted_at_idx" ON "publish_attempts"("attempted_at");

-- AddForeignKey
ALTER TABLE "publish_attempts" ADD CONSTRAINT "publish_attempts_platform_post_id_fkey" FOREIGN KEY ("platform_post_id") REFERENCES "platform_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_attempts" ADD CONSTRAINT "publish_attempts_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
