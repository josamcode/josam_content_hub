-- CreateEnum
CREATE TYPE "ContentItemStatus" AS ENUM ('idea', 'scripted', 'recorded', 'edited', 'ready', 'scheduled', 'published', 'failed', 'archived');

-- CreateEnum
CREATE TYPE "ContentCategory" AS ENUM ('programming', 'software_engineering', 'business_systems', 'ara_financial', 'portfolio_client_acquisition', 'course_content', 'saas_product_journey', 'personal_brand');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('youtube', 'instagram', 'facebook', 'tiktok');

-- CreateEnum
CREATE TYPE "PlatformPostStatus" AS ENUM ('draft', 'ready', 'scheduled', 'published', 'failed', 'manual_pending', 'manual_done');

-- CreateTable
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "ContentCategory" NOT NULL,
    "status" "ContentItemStatus" NOT NULL DEFAULT 'idea',
    "hook" TEXT,
    "script" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_posts" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "description" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "PlatformPostStatus" NOT NULL DEFAULT 'draft',
    "platform_post_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_posts_content_item_id_platform_key" ON "platform_posts"("content_item_id", "platform");

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_posts" ADD CONSTRAINT "platform_posts_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
