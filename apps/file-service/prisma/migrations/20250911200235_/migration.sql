-- AlterTable
ALTER TABLE "public"."FileUsageRule" ADD COLUMN     "voided" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."FileUsageScope" ADD COLUMN     "voided" BOOLEAN NOT NULL DEFAULT false;
