-- CreateEnum
CREATE TYPE "public"."FileContext" AS ENUM ('PERSONAL', 'ORGANIZATION', 'SHARED', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "public"."FileCategory" AS ENUM ('AVATAR', 'DOCUMENT', 'IMAGE', 'VIDEO', 'AUDIO', 'ARCHIVE', 'CODE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StorageProvider" AS ENUM ('LOCAL', 'AWS_S3', 'GOOGLE_CLOUD', 'AZURE_BLOB', 'CLOUDFLARE_R2');

-- CreateTable
CREATE TABLE "public"."files" (
    "id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "hash" TEXT,
    "uploadedById" TEXT NOT NULL,
    "organizationId" TEXT,
    "contextType" "public"."FileContext" NOT NULL DEFAULT 'PERSONAL',
    "category" "public"."FileCategory" NOT NULL DEFAULT 'DOCUMENT',
    "metadata" JSONB,
    "tags" TEXT[],
    "uploadedBy" JSONB,
    "organization" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_storage" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "provider" "public"."StorageProvider" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_storage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_uploadedById_idx" ON "public"."files"("uploadedById");

-- CreateIndex
CREATE INDEX "files_organizationId_idx" ON "public"."files"("organizationId");

-- CreateIndex
CREATE INDEX "files_contextType_idx" ON "public"."files"("contextType");

-- CreateIndex
CREATE INDEX "files_createdAt_idx" ON "public"."files"("createdAt");

-- CreateIndex
CREATE INDEX "files_hash_idx" ON "public"."files"("hash");

-- AddForeignKey
ALTER TABLE "public"."file_storage" ADD CONSTRAINT "file_storage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
