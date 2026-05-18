-- CreateEnum
CREATE TYPE "AiGenerationType" AS ENUM ('platform_metadata');

-- CreateEnum
CREATE TYPE "AiGenerationStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "ai_generation_attempts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "AiGenerationType" NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "AiGenerationStatus" NOT NULL,
    "error_message" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_generation_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_generation_attempts_user_id_idx" ON "ai_generation_attempts"("user_id");

-- CreateIndex
CREATE INDEX "ai_generation_attempts_type_idx" ON "ai_generation_attempts"("type");

-- CreateIndex
CREATE INDEX "ai_generation_attempts_status_idx" ON "ai_generation_attempts"("status");

-- CreateIndex
CREATE INDEX "ai_generation_attempts_created_at_idx" ON "ai_generation_attempts"("created_at");

-- AddForeignKey
ALTER TABLE "ai_generation_attempts" ADD CONSTRAINT "ai_generation_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
