-- CreateEnum
CREATE TYPE "MediaAssetStatus" AS ENUM ('active', 'missing', 'deleted');

-- AlterTable
ALTER TABLE "media_assets" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "missing_detected_at" TIMESTAMP(3),
ADD COLUMN     "status" "MediaAssetStatus" NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "media_assets_status_idx" ON "media_assets"("status");

-- CreateIndex
CREATE INDEX "media_assets_deleted_at_idx" ON "media_assets"("deleted_at");
