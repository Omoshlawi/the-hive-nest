-- CreateTable
CREATE TABLE "public"."IdentifierSequence" (
    "id" TEXT NOT NULL,
    "dataModel" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentifierSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentifierSequence_dataModel_key" ON "public"."IdentifierSequence"("dataModel");
