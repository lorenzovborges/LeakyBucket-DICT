import type {
  BucketSnapshot,
  CreatePixQueryAttemptInput,
  PixKeyLookup
} from './leakybucket.types';

export interface LeakyBucketTransaction {
  getBucket(): Promise<BucketSnapshot>;
  saveBucket(update: Pick<BucketSnapshot, 'availableTokens' | 'lastRefillAt'>): Promise<BucketSnapshot>;
  findPixKeyByKey(key: string): Promise<PixKeyLookup | null>;
  createAttempt(input: CreatePixQueryAttemptInput): Promise<void>;
}

export interface LeakyBucketRepository {
  withTenantLock<T>(tenantId: string, handler: (tx: LeakyBucketTransaction) => Promise<T>): Promise<T>;
}
