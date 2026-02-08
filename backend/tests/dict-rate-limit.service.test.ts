import pino from 'pino';

import { DictRateLimitService } from '../src/modules/dict/dict-rate-limit.service';
import type { AuthTenant } from '../src/modules/tenant/tenant.repository';
import { InMemoryDictRepository } from './helpers/in-memory-dict-repository';

const TENANT_A: AuthTenant = {
  id: 'tenant-a',
  name: 'Tenant A',
  tokenHash: 'hash-a',
  participantCode: 'PSP-A',
  participantCategory: 'A'
};

const TENANT_B: AuthTenant = {
  id: 'tenant-b',
  name: 'Tenant B',
  tokenHash: 'hash-b',
  participantCode: 'PSP-H',
  participantCategory: 'H'
};

function createService(initialDate = new Date('2026-01-01T00:00:00.000Z')) {
  let now = new Date(initialDate);
  const repository = new InMemoryDictRepository();

  const service = new DictRateLimitService({
    repository,
    logger: pino({ enabled: false }),
    clock: () => new Date(now)
  });

  return {
    service,
    repository,
    addMinutes(minutes: number) {
      now = new Date(now.getTime() + minutes * 60 * 1000);
    }
  };
}

describe('DICT rate limit service', () => {
  it('applies anti-scan charges for getEntry and allows request when buckets have balance', async () => {
    const { service, repository } = createService();

    const result = await service.simulateOperation(TENANT_A, {
      operation: 'GET_ENTRY',
      simulatedStatusCode: 200,
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-100'
    });

    expect(result.allowed).toBe(true);
    expect(result.httpStatus).toBe(200);
    expect(result.impacts).toHaveLength(2);

    const userTokens = repository.getBucketTokens({
      policyCode: 'ENTRIES_READ_USER_ANTISCAN',
      scopeType: 'USER',
      scopeKey: 'tenant-a:12345678901'
    });

    const pspTokens = repository.getBucketTokens({
      policyCode: 'ENTRIES_READ_PARTICIPANT_ANTISCAN',
      scopeType: 'PSP',
      scopeKey: 'tenant-a'
    });

    expect(userTokens).toBe(99);
    expect(pspTokens).toBe(49999);
  });

  it('returns 429 when any applicable policy has insufficient tokens', async () => {
    const { service } = createService();

    for (let index = 0; index < 5; index += 1) {
      const response = await service.simulateOperation(TENANT_B, {
        operation: 'GET_ENTRY',
        simulatedStatusCode: 404,
        payerId: '12345678901',
        keyType: 'EMAIL',
        endToEndId: `E2E-${index}`
      });

      expect(response.allowed).toBe(true);
    }

    const blocked = await service.simulateOperation(TENANT_B, {
      operation: 'GET_ENTRY',
      simulatedStatusCode: 404,
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-blocked'
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.httpStatus).toBe(429);
    expect(blocked.blockedByPolicies).toContain('ENTRIES_READ_USER_ANTISCAN');
  });

  it('does not create buckets when payment is registered without eligible lookup trace', async () => {
    const { service, repository } = createService();

    const first = await service.registerPaymentSent(TENANT_A, {
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-no-trace'
    });

    const second = await service.registerPaymentSent(TENANT_A, {
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-no-trace'
    });

    expect(first.credited).toBe(false);
    expect(first.reason).toBe('ENTRY_LOOKUP_NOT_ELIGIBLE');
    expect(second.credited).toBe(false);
    expect(second.reason).toBe('ENTRY_LOOKUP_NOT_ELIGIBLE');

    const userTokens = repository.getBucketTokens({
      policyCode: 'ENTRIES_READ_USER_ANTISCAN',
      scopeType: 'USER',
      scopeKey: 'tenant-a:12345678901'
    });

    const pspTokens = repository.getBucketTokens({
      policyCode: 'ENTRIES_READ_PARTICIPANT_ANTISCAN',
      scopeType: 'PSP',
      scopeKey: 'tenant-a'
    });

    expect(userTokens).toBeNull();
    expect(pspTokens).toBeNull();
  });

  it('does not credit anti-scan buckets for ineligible lookup traces', async () => {
    const { service, repository } = createService();

    await service.simulateOperation(TENANT_A, {
      operation: 'GET_ENTRY',
      simulatedStatusCode: 404,
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-credit-1'
    });

    const result = await service.registerPaymentSent(TENANT_A, {
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-credit-1'
    });

    expect(result.credited).toBe(false);
    expect(result.reason).toBe('ENTRY_LOOKUP_NOT_ELIGIBLE');
    expect(result.impacts).toHaveLength(0);

    const hasCredit = repository.hasPaymentCredit(
      TENANT_A.id,
      '12345678901',
      'EMAIL',
      'E2E-credit-1'
    );

    expect(hasCredit).toBe(false);
  });

  it('credits anti-scan buckets when payment is registered for eligible lookups and enforces idempotency', async () => {
    const { service, repository } = createService();

    await service.simulateOperation(TENANT_A, {
      operation: 'GET_ENTRY',
      simulatedStatusCode: 200,
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-credit-2'
    });

    const first = await service.registerPaymentSent(TENANT_A, {
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-credit-2'
    });

    expect(first.credited).toBe(true);
    expect(first.reason).toBe('CREDIT_APPLIED');
    expect(first.impacts).toHaveLength(2);

    const second = await service.registerPaymentSent(TENANT_A, {
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-credit-2'
    });

    expect(second.credited).toBe(false);
    expect(second.reason).toBe('PAYMENT_ALREADY_REGISTERED');

    const hasCredit = repository.hasPaymentCredit(
      TENANT_A.id,
      '12345678901',
      'EMAIL',
      'E2E-credit-2'
    );

    expect(hasCredit).toBe(true);
  });

  it('refills buckets over time with continuous strategy', async () => {
    const { service, addMinutes } = createService();

    await service.simulateOperation(TENANT_A, {
      operation: 'GET_ENTRY',
      simulatedStatusCode: 404,
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-refill-1'
    });

    addMinutes(10);

    const state = await service.getBucketState(TENANT_A, {
      policyCode: 'ENTRIES_READ_USER_ANTISCAN',
      scopeType: 'USER',
      scopeKey: 'tenant-a:12345678901'
    });

    expect(state).not.toBeNull();
    expect(state?.tokens).toBeGreaterThanOrEqual(80);
  });
});
