import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type {
  DictBucketIdentity,
  DictBucketSnapshot,
  DictEntryLookupTraceCreateInput,
  DictEntryLookupTraceSearchInput,
  DictOperationAttemptCreateInput,
  DictPaymentCreditCreateInput,
  DictPolicyImpact,
  DictPolicyCode,
  DictScopeType
} from './dict.types';

export interface DictBucketLockInput extends DictBucketIdentity {
  initialTokens: number;
}

interface DictBucketStateFilter {
  policyCode?: DictPolicyCode | null;
  scopeType?: DictScopeType | null;
}

export interface DictRepositoryTransaction {
  getLockedBuckets(): Promise<DictBucketSnapshot[]>;
  saveBuckets(updates: DictBucketSnapshot[]): Promise<void>;
  createOperationAttempt(input: DictOperationAttemptCreateInput): Promise<string>;
  createOperationImpacts(attemptId: string, impacts: DictPolicyImpact[]): Promise<void>;
  createEntryLookupTrace(input: DictEntryLookupTraceCreateInput): Promise<void>;
  createPaymentCredit(input: DictPaymentCreditCreateInput): Promise<boolean>;
}

export interface DictRepository {
  withLockedBuckets<T>(
    locks: DictBucketLockInput[],
    handler: (transaction: DictRepositoryTransaction) => Promise<T>
  ): Promise<T>;
  hasEligibleEntryLookupTrace(input: DictEntryLookupTraceSearchInput): Promise<boolean>;
  getBucketState(identity: DictBucketIdentity): Promise<DictBucketSnapshot | null>;
  listBucketStatesForTenant(
    tenantId: string,
    filter: DictBucketStateFilter
  ): Promise<DictBucketSnapshot[]>;
}

function toBucketKey(identity: DictBucketIdentity): string {
  return `${identity.policyCode}|${identity.scopeType}|${identity.scopeKey}`;
}

function normalizeLockInputs(locks: DictBucketLockInput[]): DictBucketLockInput[] {
  const deduped = new Map<string, DictBucketLockInput>();

  for (const lock of locks) {
    const key = toBucketKey(lock);
    const existing = deduped.get(key);

    if (!existing || lock.initialTokens > existing.initialTokens) {
      deduped.set(key, lock);
    }
  }

  return [...deduped.values()].sort((left, right) => {
    const leftKey = toBucketKey(left);
    const rightKey = toBucketKey(right);
    return leftKey.localeCompare(rightKey);
  });
}

function mapBucketRow(bucket: {
  policyCode: string;
  scopeType: string;
  scopeKey: string;
  tokens: Prisma.Decimal;
  lastRefillAt: Date;
}): DictBucketSnapshot {
  return {
    policyCode: bucket.policyCode as DictPolicyCode,
    scopeType: bucket.scopeType as DictScopeType,
    scopeKey: bucket.scopeKey,
    tokens: bucket.tokens.toNumber(),
    lastRefillAt: bucket.lastRefillAt
  };
}

export class PrismaDictRepository implements DictRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async withLockedBuckets<T>(
    lockInputs: DictBucketLockInput[],
    handler: (transaction: DictRepositoryTransaction) => Promise<T>
  ): Promise<T> {
    const locks = normalizeLockInputs(lockInputs);

    return this.prisma.$transaction(async (transaction) => {
      if (locks.length > 0) {
        for (const lock of locks) {
          await transaction.dictBucket.createMany({
            data: [
              {
                policyCode: lock.policyCode,
                scopeType: lock.scopeType,
                scopeKey: lock.scopeKey,
                tokens: new Prisma.Decimal(lock.initialTokens),
                lastRefillAt: new Date()
              }
            ],
            skipDuplicates: true
          });
        }

        for (const lock of locks) {
          await transaction.$queryRaw<Array<{ id: string }>>`
            SELECT "id"
            FROM "DictBucket"
            WHERE "policyCode" = CAST(${lock.policyCode} AS "DictPolicyCode")
              AND "scopeType" = CAST(${lock.scopeType} AS "DictScopeType")
              AND "scopeKey" = ${lock.scopeKey}
            FOR UPDATE
          `;
        }
      }

      const tx: DictRepositoryTransaction = {
        getLockedBuckets: async () => {
          if (locks.length === 0) {
            return [];
          }

          const buckets = await transaction.dictBucket.findMany({
            where: {
              OR: locks.map((lock) => ({
                policyCode: lock.policyCode,
                scopeType: lock.scopeType,
                scopeKey: lock.scopeKey
              }))
            },
            select: {
              policyCode: true,
              scopeType: true,
              scopeKey: true,
              tokens: true,
              lastRefillAt: true
            }
          });

          return buckets.map(mapBucketRow);
        },
        saveBuckets: async (updates) => {
          for (const update of updates) {
            await transaction.dictBucket.update({
              where: {
                policyCode_scopeType_scopeKey: {
                  policyCode: update.policyCode,
                  scopeType: update.scopeType,
                  scopeKey: update.scopeKey
                }
              },
              data: {
                tokens: new Prisma.Decimal(update.tokens),
                lastRefillAt: update.lastRefillAt
              }
            });
          }
        },
        createOperationAttempt: async (input) => {
          const attempt = await transaction.dictOperationAttempt.create({
            data: {
              tenantId: input.tenantId,
              operation: input.operation,
              simulatedStatusCode: input.simulatedStatusCode,
              allowed: input.allowed,
              httpStatus: input.httpStatus,
              requestPayload: input.requestPayload as Prisma.InputJsonValue
            },
            select: {
              id: true
            }
          });

          return attempt.id;
        },
        createOperationImpacts: async (attemptId, impacts) => {
          if (impacts.length === 0) {
            return;
          }

          await transaction.dictOperationPolicyImpact.createMany({
            data: impacts.map((impact) => ({
              attemptId,
              policyCode: impact.policyCode,
              scopeType: impact.scopeType,
              scopeKey: impact.scopeKey,
              costApplied: new Prisma.Decimal(impact.costApplied),
              tokensBefore: new Prisma.Decimal(impact.tokensBefore),
              tokensAfter: new Prisma.Decimal(impact.tokensAfter),
              capacity: new Prisma.Decimal(impact.capacity),
              refillPerSecond: new Prisma.Decimal(impact.refillPerSecond)
            }))
          });
        },
        createEntryLookupTrace: async (input) => {
          await transaction.dictEntryLookupTrace.create({
            data: {
              tenantId: input.tenantId,
              payerId: input.payerId,
              keyType: input.keyType,
              endToEndId: input.endToEndId,
              simulatedStatusCode: input.simulatedStatusCode,
              eligibleForCredit: input.eligibleForCredit
            }
          });
        },
        createPaymentCredit: async (input) => {
          try {
            await transaction.dictPaymentCredit.create({
              data: {
                tenantId: input.tenantId,
                payerId: input.payerId,
                keyType: input.keyType,
                endToEndId: input.endToEndId,
                impactPayload: input.impactPayload as Prisma.InputJsonValue
              }
            });

            return true;
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            ) {
              return false;
            }

            throw error;
          }
        }
      };

      return handler(tx);
    });
  }

  async hasEligibleEntryLookupTrace(input: DictEntryLookupTraceSearchInput): Promise<boolean> {
    const trace = await this.prisma.dictEntryLookupTrace.findFirst({
      where: {
        tenantId: input.tenantId,
        payerId: input.payerId,
        keyType: input.keyType,
        endToEndId: input.endToEndId,
        eligibleForCredit: true
      },
      select: {
        id: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return trace !== null;
  }

  async getBucketState(identity: DictBucketIdentity): Promise<DictBucketSnapshot | null> {
    const bucket = await this.prisma.dictBucket.findUnique({
      where: {
        policyCode_scopeType_scopeKey: {
          policyCode: identity.policyCode,
          scopeType: identity.scopeType,
          scopeKey: identity.scopeKey
        }
      },
      select: {
        policyCode: true,
        scopeType: true,
        scopeKey: true,
        tokens: true,
        lastRefillAt: true
      }
    });

    if (!bucket) {
      return null;
    }

    return mapBucketRow(bucket);
  }

  async listBucketStatesForTenant(
    tenantId: string,
    filter: DictBucketStateFilter
  ): Promise<DictBucketSnapshot[]> {
    const buckets = await this.prisma.dictBucket.findMany({
      where: {
        ...(filter.policyCode ? { policyCode: filter.policyCode } : {}),
        ...(filter.scopeType ? { scopeType: filter.scopeType } : {}),
        ...(filter.scopeType === 'PSP'
          ? { scopeKey: tenantId }
          : filter.scopeType === 'USER'
            ? { scopeKey: { startsWith: `${tenantId}:` } }
            : {
                OR: [{ scopeKey: tenantId }, { scopeKey: { startsWith: `${tenantId}:` } }]
              })
      },
      select: {
        policyCode: true,
        scopeType: true,
        scopeKey: true,
        tokens: true,
        lastRefillAt: true
      },
      orderBy: [{ policyCode: 'asc' }, { scopeType: 'asc' }, { scopeKey: 'asc' }]
    });

    return buckets.map(mapBucketRow);
  }
}
