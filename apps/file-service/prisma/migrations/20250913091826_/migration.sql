/*
  Warnings:

  - A unique constraint covering the columns `[hash]` on the table `files` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "files_hash_key" ON "public"."files"("hash");
