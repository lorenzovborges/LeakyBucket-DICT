-- CreateEnum
CREATE TYPE "ParticipantCategory" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H');

-- CreateEnum
CREATE TYPE "DictScopeType" AS ENUM ('USER', 'PSP');

-- CreateEnum
CREATE TYPE "DictPolicyCode" AS ENUM (
  'ENTRIES_READ_USER_ANTISCAN',
  'ENTRIES_READ_USER_ANTISCAN_V2',
  'ENTRIES_READ_PARTICIPANT_ANTISCAN',
  'ENTRIES_STATISTICS_READ',
  'ENTRIES_WRITE',
  'ENTRIES_UPDATE',
  'CLAIMS_READ',
  'CLAIMS_WRITE',
  'CLAIMS_LIST_WITH_ROLE',
  'CLAIMS_LIST_WITHOUT_ROLE',
  'SYNC_VERIFICATIONS_WRITE',
  'CIDS_FILES_WRITE',
  'CIDS_FILES_READ',
  'CIDS_EVENTS_LIST',
  'CIDS_ENTRIES_READ',
  'INFRACTION_REPORTS_READ',
  'INFRACTION_REPORTS_WRITE',
  'INFRACTION_REPORTS_LIST_WITH_ROLE',
  'INFRACTION_REPORTS_LIST_WITHOUT_ROLE',
  'KEYS_CHECK',
  'REFUNDS_READ',
  'REFUNDS_WRITE',
  'REFUND_LIST_WITH_ROLE',
  'REFUND_LIST_WITHOUT_ROLE',
  'FRAUD_MARKERS_READ',
  'FRAUD_MARKERS_WRITE',
  'FRAUD_MARKERS_LIST',
  'PERSONS_STATISTICS_READ',
  'POLICIES_READ',
  'POLICIES_LIST',
  'EVENT_LIST'
);

-- CreateEnum
CREATE TYPE "DictOperation" AS ENUM (
  'GET_ENTRY',
  'GET_ENTRY_STATISTICS',
  'CREATE_ENTRY',
  'DELETE_ENTRY',
  'UPDATE_ENTRY',
  'GET_CLAIM',
  'CREATE_CLAIM',
  'ACKNOWLEDGE_CLAIM',
  'CANCEL_CLAIM',
  'CONFIRM_CLAIM',
  'COMPLETE_CLAIM',
  'LIST_CLAIMS',
  'CREATE_SYNC_VERIFICATION',
  'CREATE_CID_SET_FILE',
  'GET_CID_SET_FILE',
  'LIST_CID_SET_EVENTS',
  'GET_ENTRY_BY_CID',
  'GET_INFRACTION_REPORT',
  'CREATE_INFRACTION_REPORT',
  'ACKNOWLEDGE_INFRACTION_REPORT',
  'CANCEL_INFRACTION_REPORT',
  'CLOSE_INFRACTION_REPORT',
  'UPDATE_INFRACTION_REPORT',
  'LIST_INFRACTION_REPORTS',
  'CHECK_KEYS',
  'GET_REFUND',
  'CREATE_REFUND',
  'CANCEL_REFUND',
  'CLOSE_REFUND',
  'LIST_REFUNDS',
  'GET_FRAUD_MARKER',
  'CREATE_FRAUD_MARKER',
  'CANCEL_FRAUD_MARKER',
  'LIST_FRAUD_MARKERS',
  'GET_PERSON_STATISTICS',
  'GET_BUCKET_STATE',
  'LIST_BUCKET_STATES',
  'LIST_EVENT_NOTIFICATIONS'
);

-- CreateEnum
CREATE TYPE "DictKeyType" AS ENUM ('EMAIL', 'PHONE', 'CPF', 'CNPJ', 'EVP');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "participantCode" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "participantCategory" "ParticipantCategory" NOT NULL DEFAULT 'H';

UPDATE "Tenant"
SET "participantCode" = CONCAT('TENANT-', "id")
WHERE "participantCode" IS NULL;

ALTER TABLE "Tenant" ALTER COLUMN "participantCode" SET NOT NULL;

-- CreateTable
CREATE TABLE "DictBucket" (
    "id" TEXT NOT NULL,
    "policyCode" "DictPolicyCode" NOT NULL,
    "scopeType" "DictScopeType" NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "tokens" DECIMAL(20,6) NOT NULL,
    "lastRefillAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DictBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictOperationAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "operation" "DictOperation" NOT NULL,
    "simulatedStatusCode" INTEGER NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "requestPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DictOperationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictOperationPolicyImpact" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "policyCode" "DictPolicyCode" NOT NULL,
    "scopeType" "DictScopeType" NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "costApplied" DECIMAL(20,6) NOT NULL,
    "tokensBefore" DECIMAL(20,6) NOT NULL,
    "tokensAfter" DECIMAL(20,6) NOT NULL,
    "capacity" DECIMAL(20,6) NOT NULL,
    "refillPerSecond" DECIMAL(20,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DictOperationPolicyImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictPaymentCredit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "keyType" "DictKeyType" NOT NULL,
    "endToEndId" TEXT NOT NULL,
    "impactPayload" JSONB,
    "creditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DictPaymentCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DictEntryLookupTrace" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "keyType" "DictKeyType" NOT NULL,
    "endToEndId" TEXT NOT NULL,
    "simulatedStatusCode" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DictEntryLookupTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_participantCode_key" ON "Tenant"("participantCode");

-- CreateIndex
CREATE UNIQUE INDEX "DictBucket_policyCode_scopeType_scopeKey_key" ON "DictBucket"("policyCode", "scopeType", "scopeKey");

-- CreateIndex
CREATE INDEX "DictBucket_scopeType_scopeKey_idx" ON "DictBucket"("scopeType", "scopeKey");

-- CreateIndex
CREATE INDEX "DictOperationAttempt_tenantId_createdAt_idx" ON "DictOperationAttempt"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "DictOperationPolicyImpact_attemptId_idx" ON "DictOperationPolicyImpact"("attemptId");

-- CreateIndex
CREATE INDEX "DictOperationPolicyImpact_policyCode_scopeType_scopeKey_idx" ON "DictOperationPolicyImpact"("policyCode", "scopeType", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "DictPaymentCredit_tenantId_payerId_keyType_endToEndId_key" ON "DictPaymentCredit"("tenantId", "payerId", "keyType", "endToEndId");

-- CreateIndex
CREATE INDEX "DictPaymentCredit_tenantId_payerId_endToEndId_idx" ON "DictPaymentCredit"("tenantId", "payerId", "endToEndId");

-- CreateIndex
CREATE INDEX "DictEntryLookupTrace_tenantId_payerId_endToEndId_idx" ON "DictEntryLookupTrace"("tenantId", "payerId", "endToEndId");

-- AddForeignKey
ALTER TABLE "DictOperationAttempt" ADD CONSTRAINT "DictOperationAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictOperationPolicyImpact" ADD CONSTRAINT "DictOperationPolicyImpact_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "DictOperationAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictPaymentCredit" ADD CONSTRAINT "DictPaymentCredit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DictEntryLookupTrace" ADD CONSTRAINT "DictEntryLookupTrace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
