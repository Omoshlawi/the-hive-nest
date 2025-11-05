-- CreateEnum
CREATE TYPE "public"."UploadStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "public"."file_blobs" ADD COLUMN     "status" "public"."UploadStatus" NOT NULL DEFAULT 'PENDING';
