-- AlterTable
ALTER TABLE "public"."Scene" ADD COLUMN     "voided" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Tour" ADD COLUMN     "voided" BOOLEAN NOT NULL DEFAULT false;
