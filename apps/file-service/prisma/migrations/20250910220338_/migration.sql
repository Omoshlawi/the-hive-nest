/*
  Warnings:

  - You are about to drop the column `category` on the `files` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."files" DROP COLUMN "category";

-- DropEnum
DROP TYPE "public"."FileCategory";

-- CreateIndex
CREATE INDEX "files_tags_idx" ON "public"."files"("tags");
