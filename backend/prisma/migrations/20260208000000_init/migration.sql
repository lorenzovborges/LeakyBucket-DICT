-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."PixKeyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."PixQueryAttemptResult" AS ENUM ('SUCCESS', 'FAILED', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeakyBucket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "availableTokens" INTEGER NOT NULL DEFAULT 10,
    "maxTokens" INTEGER NOT NULL DEFAULT 10,
    "lastRefillAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeakyBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PixKey" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "status" "public"."PixKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PixQueryAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pixKey" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "result" "public"."PixQueryAttemptResult" NOT NULL,
    "failureReason" TEXT,
    "tokensBefore" INTEGER NOT NULL,
    "tokensAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PixQueryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_tokenHash_key" ON "public"."Tenant"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "LeakyBucket_tenantId_key" ON "public"."LeakyBucket"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PixKey_key_key" ON "public"."PixKey"("key");

-- CreateIndex
CREATE INDEX "PixQueryAttempt_tenantId_createdAt_idx" ON "public"."PixQueryAttempt"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."LeakyBucket" ADD CONSTRAINT "LeakyBucket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PixQueryAttempt" ADD CONSTRAINT "PixQueryAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

