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
    filter: {
      policyCode?: DictPolicyCode | null;
      scopeType?: DictScopeType | null;
    }
  ): Promise<DictBucketSnapshot[]>;
}
