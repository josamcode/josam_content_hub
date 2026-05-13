-- CreateTable
CREATE TABLE "queue_slots" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time_of_day" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "queue_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_slots_user_id_idx" ON "queue_slots"("user_id");

-- CreateIndex
CREATE INDEX "queue_slots_platform_idx" ON "queue_slots"("platform");

-- CreateIndex
CREATE INDEX "queue_slots_is_active_idx" ON "queue_slots"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "queue_slots_user_id_platform_day_of_week_time_of_day_key" ON "queue_slots"("user_id", "platform", "day_of_week", "time_of_day");

-- AddForeignKey
ALTER TABLE "queue_slots" ADD CONSTRAINT "queue_slots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
