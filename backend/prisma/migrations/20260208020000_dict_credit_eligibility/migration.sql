-- AlterTable
ALTER TABLE "DictEntryLookupTrace"
ADD COLUMN "eligibleForCredit" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing records for explicit migration intent
UPDATE "DictEntryLookupTrace"
SET "eligibleForCredit" = false
WHERE "eligibleForCredit" IS DISTINCT FROM false;

-- CreateIndex
CREATE INDEX "DictEntryLookupTrace_tenantId_payerId_keyType_endToEndId_eligibleForCredit_idx"
ON "DictEntryLookupTrace"("tenantId", "payerId", "keyType", "endToEndId", "eligibleForCredit");
