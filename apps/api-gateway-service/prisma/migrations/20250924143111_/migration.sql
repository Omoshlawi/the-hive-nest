/*
  Warnings:

  - You are about to drop the column `memberPermisions` on the `member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."invitation" ADD COLUMN     "memberRelations" TEXT[];

-- AlterTable
ALTER TABLE "public"."member" DROP COLUMN "memberPermisions",
ADD COLUMN     "memberRelations" TEXT[];
