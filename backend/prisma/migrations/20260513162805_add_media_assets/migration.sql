-- CreateEnum
CREATE TYPE "MediaAssetType" AS ENUM ('video', 'thumbnail', 'image', 'attachment');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "content_item_id" TEXT NOT NULL,
    "type" "MediaAssetType" NOT NULL,
    "file_url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "duration_seconds" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "aspect_ratio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_assets_content_item_id_idx" ON "media_assets"("content_item_id");

-- CreateIndex
CREATE INDEX "media_assets_type_idx" ON "media_assets"("type");

-- AddForeignKey
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "content_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
