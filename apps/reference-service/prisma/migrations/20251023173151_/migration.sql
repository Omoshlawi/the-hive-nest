-- CreateEnum
CREATE TYPE "public"."AddressType" AS ENUM ('HOME', 'WORK', 'BILLING', 'SHIPPING', 'OFFICE', 'BRANCH', 'WAREHOUSE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."County" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capital" TEXT,
    "metadata" JSONB,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "County_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."SubCounty" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countyCode" TEXT NOT NULL,
    "metadata" JSONB,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCounty_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."Ward" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countyCode" TEXT NOT NULL,
    "subCountyCode" TEXT NOT NULL,
    "metadata" JSONB,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "public"."Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "user" JSONB,
    "organizationId" TEXT,
    "organization" JSONB,
    "type" "public"."AddressType" NOT NULL DEFAULT 'OTHER',
    "label" TEXT,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "landmark" TEXT,
    "level1" TEXT NOT NULL,
    "level2" TEXT,
    "level3" TEXT,
    "level4" TEXT,
    "level5" TEXT,
    "cityVillage" TEXT,
    "stateProvince" TEXT,
    "country" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "plusCode" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "preferred" BOOLEAN NOT NULL DEFAULT false,
    "formatted" TEXT,
    "localeFormat" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AddressHierarchy" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AddressHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "County_code_key" ON "public"."County"("code");

-- CreateIndex
CREATE INDEX "County_code_name_idx" ON "public"."County"("code", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SubCounty_code_key" ON "public"."SubCounty"("code");

-- CreateIndex
CREATE INDEX "SubCounty_countyCode_name_idx" ON "public"."SubCounty"("countyCode", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_code_key" ON "public"."Ward"("code");

-- CreateIndex
CREATE INDEX "Ward_subCountyCode_name_idx" ON "public"."Ward"("subCountyCode", "name");

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "public"."Address"("userId");

-- CreateIndex
CREATE INDEX "Address_organizationId_idx" ON "public"."Address"("organizationId");

-- CreateIndex
CREATE INDEX "Address_userId_preferred_idx" ON "public"."Address"("userId", "preferred");

-- CreateIndex
CREATE INDEX "Address_organizationId_preferred_idx" ON "public"."Address"("organizationId", "preferred");

-- CreateIndex
CREATE INDEX "Address_country_idx" ON "public"."Address"("country");

-- CreateIndex
CREATE INDEX "Address_level1_level2_level3_idx" ON "public"."Address"("level1", "level2", "level3");

-- CreateIndex
CREATE INDEX "AddressHierarchy_country_level_idx" ON "public"."AddressHierarchy"("country", "level");

-- CreateIndex
CREATE INDEX "AddressHierarchy_parentId_idx" ON "public"."AddressHierarchy"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AddressHierarchy_country_code_key" ON "public"."AddressHierarchy"("country", "code");

-- AddForeignKey
ALTER TABLE "public"."SubCounty" ADD CONSTRAINT "SubCounty_countyCode_fkey" FOREIGN KEY ("countyCode") REFERENCES "public"."County"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ward" ADD CONSTRAINT "Ward_countyCode_fkey" FOREIGN KEY ("countyCode") REFERENCES "public"."County"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ward" ADD CONSTRAINT "Ward_subCountyCode_fkey" FOREIGN KEY ("subCountyCode") REFERENCES "public"."SubCounty"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AddressHierarchy" ADD CONSTRAINT "AddressHierarchy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."AddressHierarchy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
