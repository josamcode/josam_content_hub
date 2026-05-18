-- CreateTable
CREATE TABLE "ai_brand_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "audience" TEXT,
    "tone" TEXT,
    "language" VARCHAR(80),
    "content_goal" TEXT,
    "cta_style" TEXT,
    "forbidden_words" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hashtag_bank" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "services_to_promote" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "course_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "platform_instructions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_brand_profiles_user_id_key" ON "ai_brand_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "ai_brand_profiles" ADD CONSTRAINT "ai_brand_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
