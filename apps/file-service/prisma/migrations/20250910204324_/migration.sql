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
    "hash" TEXT NOT NULL,
    "relatedModelId" TEXT NOT NULL,
    "relatedModelName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "organizationId" TEXT,
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
    "remoteId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileUsageScope" (
    "id" UUID NOT NULL,
    "modelName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileUsageScope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FileUsageRule" (
    "id" UUID NOT NULL,
    "scopeId" UUID NOT NULL,
    "maxFiles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileUsageRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_uploadedById_idx" ON "public"."files"("uploadedById");

-- CreateIndex
CREATE INDEX "files_organizationId_idx" ON "public"."files"("organizationId");

-- CreateIndex
CREATE INDEX "files_createdAt_idx" ON "public"."files"("createdAt");

-- CreateIndex
CREATE INDEX "files_hash_idx" ON "public"."files"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "file_storage_remoteId_key" ON "public"."file_storage"("remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "FileUsageScope_modelName_purpose_key" ON "public"."FileUsageScope"("modelName", "purpose");

-- AddForeignKey
ALTER TABLE "public"."file_storage" ADD CONSTRAINT "file_storage_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FileUsageRule" ADD CONSTRAINT "FileUsageRule_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "public"."FileUsageScope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
