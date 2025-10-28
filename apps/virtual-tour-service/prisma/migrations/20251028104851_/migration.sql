-- CreateTable
CREATE TABLE "public"."Tour" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "listingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Scene" (
    "id" TEXT NOT NULL,
    "tourId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tileBaseUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "tileSize" INTEGER NOT NULL DEFAULT 512,
    "maxLevel" INTEGER NOT NULL,
    "hotspots" JSONB NOT NULL DEFAULT '[]',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tour_propertyId_idx" ON "public"."Tour"("propertyId");

-- CreateIndex
CREATE INDEX "Tour_listingId_idx" ON "public"."Tour"("listingId");

-- CreateIndex
CREATE INDEX "Scene_tourId_idx" ON "public"."Scene"("tourId");

-- AddForeignKey
ALTER TABLE "public"."Scene" ADD CONSTRAINT "Scene_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "public"."Tour"("id") ON DELETE CASCADE ON UPDATE CASCADE;
