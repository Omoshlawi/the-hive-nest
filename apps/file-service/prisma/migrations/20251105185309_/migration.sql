/*
  Warnings:

  - The `metadata` column on the `file_blobs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `metadata` column on the `file_metadata` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."file_blobs" DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "public"."file_metadata" DROP COLUMN "metadata",
ADD COLUMN     "metadata" JSONB;
