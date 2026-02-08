import type {
  DictBucketIdentity,
  DictBucketSnapshot,
  DictEntryLookupTraceCreateInput,
  DictEntryLookupTraceSearchInput,
  DictOperationAttemptCreateInput,
  DictPolicyImpact,
  DictPolicyCode,
  DictScopeType
} from './dict.types';
import type {
  DictBucketLockInput,
  DictRepository,
  DictRepositoryTransaction
} from './dict.repository';

interface DictAttemptRecord extends DictOperationAttemptCreateInput {
  id: string;
}

interface DictCreditRecord {
  tenantId: string;
  payerId: string;
  keyType: string;
  endToEndId: string;
  impactPayload: unknown;
}

function toBucketKey(identity: DictBucketIdentity): string {
  return `${identity.policyCode}|${identity.scopeType}|${identity.scopeKey}`;
}

function cloneBucket(bucket: DictBucketSnapshot): DictBucketSnapshot {
  return {
    policyCode: bucket.policyCode,
    scopeType: bucket.scopeType,
    scopeKey: bucket.scopeKey,
    tokens: bucket.tokens,
    lastRefillAt: new Date(bucket.lastRefillAt)
  };
}

export class InMemoryDictRepository implements DictRepository {
  private readonly buckets = new Map<string, DictBucketSnapshot>();
  private readonly attempts: DictAttemptRecord[] = [];
  private readonly impacts: Array<DictPolicyImpact & { attemptId: string }> = [];
  private readonly lookupTraces: DictEntryLookupTraceCreateInput[] = [];
  private readonly paymentCredits = new Map<string, DictCreditRecord>();
  private lock: Promise<void> = Promise.resolve();

  async withLockedBuckets<T>(
    lockInputs: DictBucketLockInput[],
    handler: (transaction: DictRepositoryTransaction) => Promise<T>
  ): Promise<T> {
    const previousLock = this.lock;
    let releaseLock = () => {};

    this.lock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;

    const dedupedLocks = new Map<string, DictBucketLockInput>();

    for (const lockInput of lockInputs) {
      const key = toBucketKey(lockInput);
      const existing = dedupedLocks.get(key);

      if (!existing || lockInput.initialTokens > existing.initialTokens) {
        dedupedLocks.set(key, lockInput);
      }
    }

    for (const lock of dedupedLocks.values()) {
      const bucketKey = toBucketKey(lock);

      if (!this.buckets.has(bucketKey)) {
        this.buckets.set(bucketKey, {
          policyCode: lock.policyCode,
          scopeType: lock.scopeType,
          scopeKey: lock.scopeKey,
          tokens: lock.initialTokens,
          lastRefillAt: new Date()
        });
      }
    }

    const tx: DictRepositoryTransaction = {
      getLockedBuckets: async () => {
        return [...dedupedLocks.values()]
          .map((lock) => this.buckets.get(toBucketKey(lock)))
          .filter((bucket): bucket is DictBucketSnapshot => bucket !== undefined)
          .map(cloneBucket);
      },
      saveBuckets: async (updates) => {
        for (const update of updates) {
          this.buckets.set(toBucketKey(update), cloneBucket(update));
        }
      },
      createOperationAttempt: async (input) => {
        const id = `attempt-${this.attempts.length + 1}`;
        this.attempts.push({
          id,
          ...input
        });

        return id;
      },
      createOperationImpacts: async (attemptId, impacts) => {
        for (const impact of impacts) {
          this.impacts.push({
            ...impact,
            attemptId
          });
        }
      },
      createEntryLookupTrace: async (input) => {
        this.lookupTraces.push({
          ...input
        });
      },
      createPaymentCredit: async (input) => {
        const key = `${input.tenantId}|${input.payerId}|${input.keyType}|${input.endToEndId}`;

        if (this.paymentCredits.has(key)) {
          return false;
        }

        this.paymentCredits.set(key, {
          tenantId: input.tenantId,
          payerId: input.payerId,
          keyType: input.keyType,
          endToEndId: input.endToEndId,
          impactPayload: input.impactPayload
        });

        return true;
      }
    };

    try {
      return await handler(tx);
    } finally {
      releaseLock();
    }
  }

  async hasEligibleEntryLookupTrace(input: DictEntryLookupTraceSearchInput): Promise<boolean> {
    return this.lookupTraces.some(
      (trace) =>
        trace.tenantId === input.tenantId &&
        trace.payerId === input.payerId &&
        trace.keyType === input.keyType &&
        trace.endToEndId === input.endToEndId &&
        trace.eligibleForCredit
    );
  }

  async getBucketState(identity: DictBucketIdentity): Promise<DictBucketSnapshot | null> {
    const bucket = this.buckets.get(toBucketKey(identity));
    return bucket ? cloneBucket(bucket) : null;
  }

  async listBucketStatesForTenant(
    tenantId: string,
    filter: {
      policyCode?: DictPolicyCode | null;
      scopeType?: DictScopeType | null;
    }
  ): Promise<DictBucketSnapshot[]> {
    return [...this.buckets.values()]
      .filter((bucket) => {
        const belongsToTenant =
          bucket.scopeKey === tenantId || bucket.scopeKey.startsWith(`${tenantId}:`);

        if (!belongsToTenant) {
          return false;
        }

        if (filter.policyCode && bucket.policyCode !== filter.policyCode) {
          return false;
        }

        if (filter.scopeType && bucket.scopeType !== filter.scopeType) {
          return false;
        }

        return true;
      })
      .map(cloneBucket)
      .sort((left, right) => {
        const leftKey = toBucketKey(left);
        const rightKey = toBucketKey(right);
        return leftKey.localeCompare(rightKey);
      });
  }

  getAttempts(): DictAttemptRecord[] {
    return this.attempts.map((attempt) => ({
      ...attempt,
      requestPayload: attempt.requestPayload
    }));
  }

  getImpactsByAttempt(attemptId: string): DictPolicyImpact[] {
    return this.impacts
      .filter((impact) => impact.attemptId === attemptId)
      .map((impact) => ({
        policyCode: impact.policyCode,
        scopeType: impact.scopeType,
        scopeKey: impact.scopeKey,
        costApplied: impact.costApplied,
        tokensBefore: impact.tokensBefore,
        tokensAfter: impact.tokensAfter,
        capacity: impact.capacity,
        refillPerSecond: impact.refillPerSecond
      }));
  }

  hasPaymentCredit(
    tenantId: string,
    payerId: string,
    keyType: string,
    endToEndId: string
  ): boolean {
    return this.paymentCredits.has(`${tenantId}|${payerId}|${keyType}|${endToEndId}`);
  }

  addEntryLookupTrace(trace: DictEntryLookupTraceCreateInput): void {
    this.lookupTraces.push({
      ...trace
    });
  }

  getBucketTokens(identity: DictBucketIdentity): number | null {
    const bucket = this.buckets.get(toBucketKey(identity));
    return bucket ? bucket.tokens : null;
  }
}
