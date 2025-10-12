-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('Male', 'Female', 'Unknown');

-- CreateTable
CREATE TABLE "public"."Person" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "surname" TEXT,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "gender" "public"."Gender" NOT NULL DEFAULT 'Unknown',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_userId_key" ON "public"."Person"("userId");

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
