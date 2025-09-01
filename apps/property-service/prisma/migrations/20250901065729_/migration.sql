-- CreateEnum
CREATE TYPE "public"."PropertyStatus" AS ENUM ('DRAFT', 'BLOCKED', 'ARCHIVED', 'APPROVED', 'REJECTED', 'PAUSED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."PropertyMediaType" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'TOUR_3D');

-- CreateTable
CREATE TABLE "public"."AttributeType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT,
    "icon" JSONB NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Amenity" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT,
    "icon" JSONB NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT,
    "icon" JSONB NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyStatusHistory" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "previousStatus" "public"."PropertyStatus" NOT NULL,
    "newStatus" "public"."PropertyStatus" NOT NULL,
    "changedBy" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Property" (
    "id" UUID NOT NULL,
    "propertyNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" TEXT NOT NULL,
    "organization" JSONB,
    "addressId" TEXT NOT NULL,
    "address" JSONB,
    "createdBy" UUID NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RelationshipType" (
    "id" UUID NOT NULL,
    "description" TEXT,
    "aIsToB" TEXT NOT NULL,
    "bIsToA" TEXT NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelationshipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Relationship" (
    "id" UUID NOT NULL,
    "propertyAId" UUID NOT NULL,
    "propertyBId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "typeId" UUID NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyMedia" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "type" "public"."PropertyMediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyAttribute" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyAmenity" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "amenityId" UUID NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyCategory" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttributeType_name_key" ON "public"."AttributeType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeType_name_organizationId_key" ON "public"."AttributeType"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_name_organizationId_key" ON "public"."Amenity"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_organizationId_key" ON "public"."Category"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyNumber_key" ON "public"."Property"("propertyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipType_aIsToB_key" ON "public"."RelationshipType"("aIsToB");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipType_bIsToA_key" ON "public"."RelationshipType"("bIsToA");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipType_aIsToB_bIsToA_key" ON "public"."RelationshipType"("aIsToB", "bIsToA");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_propertyAId_propertyBId_typeId_key" ON "public"."Relationship"("propertyAId", "propertyBId", "typeId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAttribute_propertyId_attributeId_key" ON "public"."PropertyAttribute"("propertyId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAmenity_propertyId_amenityId_key" ON "public"."PropertyAmenity"("propertyId", "amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyCategory_propertyId_categoryId_key" ON "public"."PropertyCategory"("propertyId", "categoryId");

-- AddForeignKey
ALTER TABLE "public"."PropertyStatusHistory" ADD CONSTRAINT "PropertyStatusHistory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "public"."RelationshipType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_propertyAId_fkey" FOREIGN KEY ("propertyAId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Relationship" ADD CONSTRAINT "Relationship_propertyBId_fkey" FOREIGN KEY ("propertyBId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyAttribute" ADD CONSTRAINT "PropertyAttribute_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyAttribute" ADD CONSTRAINT "PropertyAttribute_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "public"."AttributeType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyAmenity" ADD CONSTRAINT "PropertyAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "public"."Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyCategory" ADD CONSTRAINT "PropertyCategory_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyCategory" ADD CONSTRAINT "PropertyCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
