-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "default_publish_mode" "PublishMode" NOT NULL DEFAULT 'manual',
    "default_hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "caption_template" TEXT,
    "title_template" TEXT,
    "description_template" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_settings_user_id_idx" ON "platform_settings"("user_id");

-- CreateIndex
CREATE INDEX "platform_settings_platform_idx" ON "platform_settings"("platform");

-- CreateIndex
CREATE INDEX "platform_settings_is_enabled_idx" ON "platform_settings"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "platform_settings_user_id_platform_key" ON "platform_settings"("user_id", "platform");

-- AddForeignKey
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
