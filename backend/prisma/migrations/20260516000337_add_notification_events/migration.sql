-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('info', 'success', 'warning', 'error');

-- CreateTable
CREATE TABLE "notification_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "severity" "NotificationSeverity" NOT NULL DEFAULT 'info',
    "entity_type" TEXT,
    "entity_id" TEXT,
    "payload" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "email_status" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_events_user_id_idx" ON "notification_events"("user_id");

-- CreateIndex
CREATE INDEX "notification_events_type_idx" ON "notification_events"("type");

-- CreateIndex
CREATE INDEX "notification_events_severity_idx" ON "notification_events"("severity");

-- CreateIndex
CREATE INDEX "notification_events_is_read_idx" ON "notification_events"("is_read");

-- CreateIndex
CREATE INDEX "notification_events_created_at_idx" ON "notification_events"("created_at");

-- CreateIndex
CREATE INDEX "notification_events_user_id_is_read_created_at_idx" ON "notification_events"("user_id", "is_read", "created_at");

-- AddForeignKey
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
