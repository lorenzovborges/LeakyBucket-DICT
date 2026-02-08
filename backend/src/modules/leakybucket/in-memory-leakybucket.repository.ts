import type {
  LeakyBucketRepository,
  LeakyBucketTransaction
} from './leakybucket.repository';
import type {
  BucketSnapshot,
  CreatePixQueryAttemptInput,
  PixKeyLookup
} from './leakybucket.types';

export interface LeakyBucketSeed {
  buckets: BucketSnapshot[];
  pixKeys: PixKeyLookup[];
}

function cloneBucket(bucket: BucketSnapshot): BucketSnapshot {
  return {
    tenantId: bucket.tenantId,
    availableTokens: bucket.availableTokens,
    maxTokens: bucket.maxTokens,
    lastRefillAt: new Date(bucket.lastRefillAt)
  };
}

export class InMemoryLeakyBucketRepository implements LeakyBucketRepository {
  private readonly buckets = new Map<string, BucketSnapshot>();
  private readonly pixKeys = new Map<string, PixKeyLookup>();
  private readonly attempts: CreatePixQueryAttemptInput[] = [];
  private lock: Promise<void> = Promise.resolve();

  constructor(seed: LeakyBucketSeed) {
    for (const bucket of seed.buckets) {
      this.buckets.set(bucket.tenantId, cloneBucket(bucket));
    }

    for (const pixKey of seed.pixKeys) {
      this.pixKeys.set(pixKey.key, { ...pixKey });
    }
  }

  async withTenantLock<T>(tenantId: string, handler: (tx: LeakyBucketTransaction) => Promise<T>): Promise<T> {
    const previousLock = this.lock;
    let releaseLock = () => {};

    this.lock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;

    const tx: LeakyBucketTransaction = {
      getBucket: async () => {
        const bucket = this.buckets.get(tenantId);

        if (!bucket) {
          throw new Error(`Bucket not found for tenant ${tenantId}`);
        }

        return cloneBucket(bucket);
      },
      saveBucket: async (update) => {
        const current = this.buckets.get(tenantId);

        if (!current) {
          throw new Error(`Bucket not found for tenant ${tenantId}`);
        }

        const next: BucketSnapshot = {
          tenantId: current.tenantId,
          maxTokens: current.maxTokens,
          availableTokens: update.availableTokens,
          lastRefillAt: new Date(update.lastRefillAt)
        };

        this.buckets.set(tenantId, next);

        return cloneBucket(next);
      },
      findPixKeyByKey: async (key) => {
        const pixKey = this.pixKeys.get(key);

        if (!pixKey) {
          return null;
        }

        return { ...pixKey };
      },
      createAttempt: async (input) => {
        this.attempts.push({
          ...input,
          createdAt: new Date(input.createdAt)
        });
      }
    };

    try {
      return await handler(tx);
    } finally {
      releaseLock();
    }
  }

  getBucket(tenantId: string): BucketSnapshot {
    const bucket = this.buckets.get(tenantId);

    if (!bucket) {
      throw new Error(`Bucket not found for tenant ${tenantId}`);
    }

    return cloneBucket(bucket);
  }

  getAttemptsForTenant(tenantId: string): CreatePixQueryAttemptInput[] {
    return this.attempts
      .filter((attempt) => attempt.tenantId === tenantId)
      .map((attempt) => ({
        ...attempt,
        createdAt: new Date(attempt.createdAt)
      }));
  }
}
