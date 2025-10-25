/*
  Warnings:

  - The primary key for the `Amenity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AttributeType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Property` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyAmenity` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyAttribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyMedia` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PropertyStatusHistory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Relationship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RelationshipType` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."PropertyAmenity" DROP CONSTRAINT "PropertyAmenity_amenityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyAmenity" DROP CONSTRAINT "PropertyAmenity_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyAttribute" DROP CONSTRAINT "PropertyAttribute_attributeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyAttribute" DROP CONSTRAINT "PropertyAttribute_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyCategory" DROP CONSTRAINT "PropertyCategory_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyCategory" DROP CONSTRAINT "PropertyCategory_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyMedia" DROP CONSTRAINT "PropertyMedia_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PropertyStatusHistory" DROP CONSTRAINT "PropertyStatusHistory_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Relationship" DROP CONSTRAINT "Relationship_propertyAId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Relationship" DROP CONSTRAINT "Relationship_propertyBId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Relationship" DROP CONSTRAINT "Relationship_typeId_fkey";

-- AlterTable
ALTER TABLE "public"."Amenity" DROP CONSTRAINT "Amenity_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."AttributeType" DROP CONSTRAINT "AttributeType_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "AttributeType_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Category" DROP CONSTRAINT "Category_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Property" DROP CONSTRAINT "Property_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Property_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."PropertyAmenity" DROP CONSTRAINT "PropertyAmenity_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ALTER COLUMN "amenityId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyAmenity_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."PropertyAttribute" DROP CONSTRAINT "PropertyAttribute_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ALTER COLUMN "attributeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyAttribute_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."PropertyCategory" DROP CONSTRAINT "PropertyCategory_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ALTER COLUMN "categoryId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyCategory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."PropertyMedia" DROP CONSTRAINT "PropertyMedia_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."PropertyStatusHistory" DROP CONSTRAINT "PropertyStatusHistory_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PropertyStatusHistory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Relationship" DROP CONSTRAINT "Relationship_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "propertyAId" SET DATA TYPE TEXT,
ALTER COLUMN "propertyBId" SET DATA TYPE TEXT,
ALTER COLUMN "typeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."RelationshipType" DROP CONSTRAINT "RelationshipType_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "RelationshipType_pkey" PRIMARY KEY ("id");

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
