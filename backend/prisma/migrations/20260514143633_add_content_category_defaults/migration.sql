-- CreateTable
CREATE TABLE "content_category_defaults" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "default_goal" TEXT,
    "default_hook_style" TEXT,
    "default_caption_style" TEXT,
    "default_hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_platforms" "Platform"[] DEFAULT ARRAY[]::"Platform"[],
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_category_defaults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_category_defaults_user_id_idx" ON "content_category_defaults"("user_id");

-- CreateIndex
CREATE INDEX "content_category_defaults_category_idx" ON "content_category_defaults"("category");

-- CreateIndex
CREATE INDEX "content_category_defaults_is_active_idx" ON "content_category_defaults"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "content_category_defaults_user_id_category_key" ON "content_category_defaults"("user_id", "category");

-- AddForeignKey
ALTER TABLE "content_category_defaults" ADD CONSTRAINT "content_category_defaults_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
