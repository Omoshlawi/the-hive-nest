-- CreateTable
CREATE TABLE "public"."file_blobs" (
    "id" UUID NOT NULL,
    "hash" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "storageUrl" TEXT,
    "metadata" TEXT,
    "filename" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_blobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_metadata" (
    "id" UUID NOT NULL,
    "blobId" UUID NOT NULL,
    "originalName" TEXT NOT NULL,
    "relatedModelId" TEXT NOT NULL,
    "relatedModelName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "organizationId" TEXT,
    "metadata" TEXT,
    "tags" TEXT[],
    "description" TEXT,
    "uploadedBy" JSONB,
    "organization" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastAccessedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "file_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_usage_scopes" (
    "id" UUID NOT NULL,
    "modelName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_usage_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."file_usage_rules" (
    "id" UUID NOT NULL,
    "scopeId" UUID NOT NULL,
    "maxFiles" INTEGER NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_usage_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_blobs_hash_key" ON "public"."file_blobs"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "file_blobs_remoteId_key" ON "public"."file_blobs"("remoteId");

-- CreateIndex
CREATE INDEX "file_blobs_hash_idx" ON "public"."file_blobs"("hash");

-- CreateIndex
CREATE INDEX "file_metadata_blobId_idx" ON "public"."file_metadata"("blobId");

-- CreateIndex
CREATE INDEX "file_metadata_uploadedById_idx" ON "public"."file_metadata"("uploadedById");

-- CreateIndex
CREATE INDEX "file_metadata_organizationId_idx" ON "public"."file_metadata"("organizationId");

-- CreateIndex
CREATE INDEX "file_metadata_relatedModelName_relatedModelId_idx" ON "public"."file_metadata"("relatedModelName", "relatedModelId");

-- CreateIndex
CREATE INDEX "file_metadata_createdAt_idx" ON "public"."file_metadata"("createdAt");

-- CreateIndex
CREATE INDEX "file_metadata_tags_idx" ON "public"."file_metadata"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "file_usage_scopes_modelName_purpose_key" ON "public"."file_usage_scopes"("modelName", "purpose");

-- AddForeignKey
ALTER TABLE "public"."file_metadata" ADD CONSTRAINT "file_metadata_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "public"."file_blobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."file_usage_rules" ADD CONSTRAINT "file_usage_rules_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "public"."file_usage_scopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
