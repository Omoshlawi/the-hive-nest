/*
  Warnings:

  - You are about to drop the column `memberRelations` on the `invitation` table. All the data in the column will be lost.
  - You are about to drop the column `memberRelations` on the `member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."invitation" DROP COLUMN "memberRelations";

-- AlterTable
ALTER TABLE "public"."member" DROP COLUMN "memberRelations";
