import type { Logger } from 'pino';

import type { AuthTenant } from '../tenant/tenant.repository';
import { calculateParticipantCreditAmount, calculatePolicyCost, calculateUserCreditAmount } from './cost-calculator';
import type {
  DictBucketIdentity,
  DictBucketListFilter,
  DictBucketSnapshot,
  DictBucketState,
  DictBucketStateInput,
  DictPolicyImpact,
  DictPolicyCode,
  DictScopeType,
  FinalUserCategory,
  PolicyCharge,
  RegisterPaymentSentInput,
  RegisterPaymentSentResult,
  SimulateDictOperationInput,
  SimulateDictOperationResult
} from './dict.types';
import { DictValidationError } from './dict.types';
import type { DictBucketLockInput, DictRepository } from './dict.repository';
import { getPolicyDefinition, resolvePolicyRateConfig } from './policy-catalog';
import {
  normalizePayerId,
  resolveFinalUserCategory,
  resolvePoliciesForOperation,
  resolveUserAntiScanPolicy
} from './policy-resolver';
import {
  applyContinuousRefill,
  creditTokens,
  debitTokens,
  hasEnoughTokens
} from './token-bucket-engine';

interface DictRateLimitServiceDeps {
  repository: DictRepository;
  logger: Logger;
  clock?: () => Date;
}

function toChargeKey(identity: DictBucketIdentity): string {
  return `${identity.policyCode}|${identity.scopeType}|${identity.scopeKey}`;
}

function ensureScopeOwnership(tenant: AuthTenant, scopeType: DictScopeType, scopeKey: string): void {
  if (scopeType === 'PSP' && scopeKey !== tenant.id) {
    throw new DictValidationError('scopeKey is not allowed for authenticated tenant');
  }

  if (scopeType === 'USER' && !scopeKey.startsWith(`${tenant.id}:`)) {
    throw new DictValidationError('scopeKey is not allowed for authenticated tenant');
  }
}

function toLockInput(charges: PolicyCharge[]): DictBucketLockInput[] {
  const locks = new Map<string, DictBucketLockInput>();

  for (const charge of charges) {
    const key = toChargeKey(charge);
    const existing = locks.get(key);

    if (!existing || charge.capacity > existing.initialTokens) {
      locks.set(key, {
        policyCode: charge.policyCode,
        scopeType: charge.scopeType,
        scopeKey: charge.scopeKey,
        initialTokens: charge.capacity
      });
    }
  }

  return [...locks.values()];
}

function toBucketMap(buckets: DictBucketSnapshot[]): Map<string, DictBucketSnapshot> {
  const map = new Map<string, DictBucketSnapshot>();

  for (const bucket of buckets) {
    map.set(toChargeKey(bucket), bucket);
  }

  return map;
}

function buildBucketState(
  bucket: DictBucketSnapshot,
  capacity: number,
  refillPerSecond: number,
  now: Date
): DictBucketState {
  const refilled = applyContinuousRefill(bucket.tokens, bucket.lastRefillAt, { capacity, refillPerSecond }, now);

  return {
    policyCode: bucket.policyCode,
    scopeType: bucket.scopeType,
    scopeKey: bucket.scopeKey,
    tokens: refilled.tokens,
    capacity,
    refillPerSecond,
    lastRefillAt: refilled.lastRefillAt
  };
}

export class DictRateLimitService {
  private readonly now: () => Date;

  constructor(private readonly deps: DictRateLimitServiceDeps) {
    this.now = deps.clock ?? (() => new Date());
  }

  async simulateOperation(
    tenant: AuthTenant,
    input: SimulateDictOperationInput
  ): Promise<SimulateDictOperationResult> {
    const now = this.now();
    const normalizedPayerId = input.payerId ? normalizePayerId(input.payerId) : undefined;
    const finalUserCategory = normalizedPayerId
      ? resolveFinalUserCategory(normalizedPayerId)
      : undefined;

    const policies = resolvePoliciesForOperation({
      operation: input.operation,
      payerId: normalizedPayerId,
      keyType: input.keyType,
      endToEndId: input.endToEndId,
      hasRoleFilter: input.hasRoleFilter
    });

    const chargeMap = new Map<string, PolicyCharge>();

    for (const policyCode of policies) {
      const definition = getPolicyDefinition(policyCode);
      const scopeKey = definition.scopeType === 'USER' ? `${tenant.id}:${normalizedPayerId}` : tenant.id;

      const rateConfig = resolvePolicyRateConfig(policyCode, {
        finalUserCategory,
        participantCategory: tenant.participantCategory
      });

      const chargeKey = toChargeKey({
        policyCode,
        scopeType: definition.scopeType,
        scopeKey
      });

      const existing = chargeMap.get(chargeKey);
      const cost = calculatePolicyCost(policyCode, input.simulatedStatusCode);

      if (existing) {
        existing.costApplied += cost;
        continue;
      }

      chargeMap.set(chargeKey, {
        policyCode,
        scopeType: definition.scopeType,
        scopeKey,
        capacity: rateConfig.capacity,
        refillPerSecond: rateConfig.refillPerSecond,
        costApplied: cost
      });
    }

    const charges = [...chargeMap.values()];
    const locks = toLockInput(charges);

    return this.deps.repository.withLockedBuckets(locks, async (transaction) => {
      const currentBuckets = toBucketMap(await transaction.getLockedBuckets());
      const impacts: DictPolicyImpact[] = [];
      const blockedPolicyCodes = new Set<DictPolicyCode>();
      const bucketUpdates = new Map<string, DictBucketSnapshot>();

      for (const charge of charges) {
        const bucketKey = toChargeKey(charge);
        const current = currentBuckets.get(bucketKey);

        if (!current) {
          throw new Error(`Missing locked bucket for ${bucketKey}`);
        }

        const refilled = applyContinuousRefill(
          current.tokens,
          current.lastRefillAt,
          {
            capacity: charge.capacity,
            refillPerSecond: charge.refillPerSecond
          },
          now
        );

        if (charge.costApplied > 0 && !hasEnoughTokens(refilled.tokens, charge.costApplied)) {
          blockedPolicyCodes.add(charge.policyCode);
        }

        impacts.push({
          policyCode: charge.policyCode,
          scopeType: charge.scopeType,
          scopeKey: charge.scopeKey,
          costApplied: charge.costApplied,
          tokensBefore: refilled.tokens,
          tokensAfter: refilled.tokens,
          capacity: charge.capacity,
          refillPerSecond: charge.refillPerSecond
        });

        bucketUpdates.set(bucketKey, {
          policyCode: charge.policyCode,
          scopeType: charge.scopeType,
          scopeKey: charge.scopeKey,
          tokens: refilled.tokens,
          lastRefillAt: refilled.lastRefillAt
        });
      }

      const allowed = blockedPolicyCodes.size === 0;

      if (allowed) {
        for (const impact of impacts) {
          impact.tokensAfter = debitTokens(impact.tokensBefore, impact.costApplied);

          const key = toChargeKey(impact);
          const update = bucketUpdates.get(key);

          if (!update) {
            throw new Error(`Missing update bucket for ${key}`);
          }

          update.tokens = impact.tokensAfter;
        }
      }

      await transaction.saveBuckets([...bucketUpdates.values()]);

      const httpStatus = allowed ? input.simulatedStatusCode : 429;
      const blockedByPolicies = [...blockedPolicyCodes.values()].sort();

      const attemptId = await transaction.createOperationAttempt({
        tenantId: tenant.id,
        operation: input.operation,
        simulatedStatusCode: input.simulatedStatusCode,
        allowed,
        httpStatus,
        requestPayload: {
          ...input,
          payerId: normalizedPayerId
        }
      });

      await transaction.createOperationImpacts(attemptId, impacts);

      if (
        allowed &&
        input.operation === 'GET_ENTRY' &&
        normalizedPayerId &&
        input.keyType &&
        input.endToEndId
      ) {
        await transaction.createEntryLookupTrace({
          tenantId: tenant.id,
          payerId: normalizedPayerId,
          keyType: input.keyType,
          endToEndId: input.endToEndId,
          simulatedStatusCode: input.simulatedStatusCode,
          eligibleForCredit: input.simulatedStatusCode === 200
        });
      }

      this.deps.logger.info(
        {
          tenantId: tenant.id,
          operation: input.operation,
          simulatedStatusCode: input.simulatedStatusCode,
          httpStatus,
          blockedByPolicies
        },
        'DICT rate limit evaluated'
      );

      return {
        allowed,
        httpStatus,
        blockedByPolicies,
        impacts
      };
    });
  }

  async registerPaymentSent(
    tenant: AuthTenant,
    input: RegisterPaymentSentInput
  ): Promise<RegisterPaymentSentResult> {
    const normalizedPayerId = normalizePayerId(input.payerId);
    const finalUserCategory = resolveFinalUserCategory(normalizedPayerId);
    const hasRelatedLookup = await this.deps.repository.hasEligibleEntryLookupTrace({
      tenantId: tenant.id,
      payerId: normalizedPayerId,
      keyType: input.keyType,
      endToEndId: input.endToEndId
    });

    if (!hasRelatedLookup) {
      return {
        credited: false,
        reason: 'ENTRY_LOOKUP_NOT_ELIGIBLE',
        impacts: []
      };
    }

    const userPolicyCode = resolveUserAntiScanPolicy(input.keyType);
    const now = this.now();

    const userRate = resolvePolicyRateConfig(userPolicyCode, {
      finalUserCategory,
      participantCategory: tenant.participantCategory
    });

    const pspRate = resolvePolicyRateConfig('ENTRIES_READ_PARTICIPANT_ANTISCAN', {
      finalUserCategory,
      participantCategory: tenant.participantCategory
    });

    const charges: PolicyCharge[] = [
      {
        policyCode: userPolicyCode,
        scopeType: 'USER',
        scopeKey: `${tenant.id}:${normalizedPayerId}`,
        capacity: userRate.capacity,
        refillPerSecond: userRate.refillPerSecond,
        costApplied: -calculateUserCreditAmount(finalUserCategory)
      },
      {
        policyCode: 'ENTRIES_READ_PARTICIPANT_ANTISCAN',
        scopeType: 'PSP',
        scopeKey: tenant.id,
        capacity: pspRate.capacity,
        refillPerSecond: pspRate.refillPerSecond,
        costApplied: -calculateParticipantCreditAmount()
      }
    ];

    return this.deps.repository.withLockedBuckets(toLockInput(charges), async (transaction) => {
      const currentBuckets = toBucketMap(await transaction.getLockedBuckets());
      const impacts: DictPolicyImpact[] = [];
      const bucketUpdates = new Map<string, DictBucketSnapshot>();

      for (const charge of charges) {
        const bucketKey = toChargeKey(charge);
        const current = currentBuckets.get(bucketKey);

        if (!current) {
          throw new Error(`Missing locked bucket for ${bucketKey}`);
        }

        const refilled = applyContinuousRefill(
          current.tokens,
          current.lastRefillAt,
          {
            capacity: charge.capacity,
            refillPerSecond: charge.refillPerSecond
          },
          now
        );

        const creditAmount = Math.abs(charge.costApplied);
        const tokensAfter = creditTokens(refilled.tokens, creditAmount, charge.capacity);

        impacts.push({
          policyCode: charge.policyCode,
          scopeType: charge.scopeType,
          scopeKey: charge.scopeKey,
          costApplied: charge.costApplied,
          tokensBefore: refilled.tokens,
          tokensAfter,
          capacity: charge.capacity,
          refillPerSecond: charge.refillPerSecond
        });

        bucketUpdates.set(bucketKey, {
          policyCode: charge.policyCode,
          scopeType: charge.scopeType,
          scopeKey: charge.scopeKey,
          tokens: tokensAfter,
          lastRefillAt: refilled.lastRefillAt
        });
      }

      const created = await transaction.createPaymentCredit({
        tenantId: tenant.id,
        payerId: normalizedPayerId,
        keyType: input.keyType,
        endToEndId: input.endToEndId,
        impactPayload: impacts
      });

      if (!created) {
        return {
          credited: false,
          reason: 'PAYMENT_ALREADY_REGISTERED',
          impacts: []
        };
      }

      await transaction.saveBuckets([...bucketUpdates.values()]);

      this.deps.logger.info(
        {
          tenantId: tenant.id,
          payerId: normalizedPayerId,
          keyType: input.keyType,
          endToEndId: input.endToEndId
        },
        'DICT payment credit applied'
      );

      return {
        credited: true,
        reason: 'CREDIT_APPLIED',
        impacts
      };
    });
  }

  async getBucketState(tenant: AuthTenant, input: DictBucketStateInput): Promise<DictBucketState | null> {
    ensureScopeOwnership(tenant, input.scopeType, input.scopeKey);

    const bucket = await this.deps.repository.getBucketState(input);

    if (!bucket) {
      return null;
    }

    const rateConfig = this.resolveRateConfigForScopeKey(tenant, bucket);
    return buildBucketState(bucket, rateConfig.capacity, rateConfig.refillPerSecond, this.now());
  }

  async listBucketStates(
    tenant: AuthTenant,
    filter: DictBucketListFilter
  ): Promise<DictBucketState[]> {
    const buckets = await this.deps.repository.listBucketStatesForTenant(tenant.id, filter);
    const now = this.now();

    return buckets.map((bucket) => {
      const rateConfig = this.resolveRateConfigForScopeKey(tenant, bucket);
      return buildBucketState(bucket, rateConfig.capacity, rateConfig.refillPerSecond, now);
    });
  }

  private resolveRateConfigForScopeKey(
    tenant: AuthTenant,
    bucket: DictBucketIdentity
  ): { capacity: number; refillPerSecond: number } {
    const definition = getPolicyDefinition(bucket.policyCode);

    if (definition.scopeType === 'USER') {
      const prefix = `${tenant.id}:`;

      if (!bucket.scopeKey.startsWith(prefix)) {
        throw new DictValidationError('Invalid USER scope key for this tenant');
      }

      const payerId = bucket.scopeKey.slice(prefix.length);
      const finalUserCategory: FinalUserCategory = resolveFinalUserCategory(payerId);

      return resolvePolicyRateConfig(bucket.policyCode, {
        finalUserCategory,
        participantCategory: tenant.participantCategory
      });
    }

    return resolvePolicyRateConfig(bucket.policyCode, {
      participantCategory: tenant.participantCategory
    });
  }
}
