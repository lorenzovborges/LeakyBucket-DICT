import pino from 'pino';

import {
  LeakyBucketService,
  applyHourlyRefill
} from '../src/modules/leakybucket/leakybucket.service';
import type { BucketSnapshot } from '../src/modules/leakybucket/leakybucket.types';
import { PixService } from '../src/modules/pix/pix.service';
import { InMemoryLeakyBucketRepository } from './helpers/in-memory-repositories';

const BASE_DATE = new Date('2026-01-01T00:00:00.000Z');

function createService(initialBucket: BucketSnapshot) {
  let now = new Date(BASE_DATE);

  const repository = new InMemoryLeakyBucketRepository({
    buckets: [initialBucket],
    pixKeys: [
      {
        key: 'valid-pix-key-001',
        ownerName: 'Joao Silva',
        bankName: 'Leaky Bank',
        status: 'ACTIVE'
      }
    ]
  });

  const service = new LeakyBucketService({
    repository,
    pixService: new PixService(),
    logger: pino({ enabled: false }),
    clock: () => new Date(now)
  });

  return {
    service,
    repository,
    advanceHours(hours: number) {
      now = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
  };
}

describe('Leaky bucket refill algorithm', () => {
  it('adds one token per elapsed hour and advances lastRefillAt by elapsed full hours', () => {
    const initialBucket: BucketSnapshot = {
      tenantId: 'tenant-a',
      availableTokens: 8,
      maxTokens: 10,
      lastRefillAt: new Date('2026-01-01T00:15:00.000Z')
    };

    const result = applyHourlyRefill(initialBucket, new Date('2026-01-01T02:40:00.000Z'));

    expect(result.availableTokens).toBe(10);
    expect(result.lastRefillAt.toISOString()).toBe('2026-01-01T02:15:00.000Z');
  });

  it('never exceeds maxTokens even after many hours', () => {
    const initialBucket: BucketSnapshot = {
      tenantId: 'tenant-a',
      availableTokens: 10,
      maxTokens: 10,
      lastRefillAt: new Date('2026-01-01T00:00:00.000Z')
    };

    const result = applyHourlyRefill(initialBucket, new Date('2026-01-01T20:00:00.000Z'));

    expect(result.availableTokens).toBe(10);
    expect(result.lastRefillAt.toISOString()).toBe('2026-01-01T20:00:00.000Z');
  });
});

describe('Leaky bucket service behavior', () => {
  it('keeps token on success and consumes one token on failure', async () => {
    const initialBucket: BucketSnapshot = {
      tenantId: 'tenant-a',
      availableTokens: 10,
      maxTokens: 10,
      lastRefillAt: new Date(BASE_DATE)
    };

    const { service } = createService(initialBucket);

    const success = await service.queryPixKey('tenant-a', {
      pixKey: 'valid-pix-key-001',
      amount: 10
    });

    expect(success.status).toBe('SUCCESS');
    expect(success.consumedToken).toBe(false);
    expect(success.availableTokens).toBe(10);

    const failure = await service.queryPixKey('tenant-a', {
      pixKey: 'missing-pix-key',
      amount: 10
    });

    expect(failure.status).toBe('FAILED');
    expect(failure.consumedToken).toBe(true);
    expect(failure.availableTokens).toBe(9);
  });

  it('refills one token after one hour when below max', async () => {
    const initialBucket: BucketSnapshot = {
      tenantId: 'tenant-a',
      availableTokens: 9,
      maxTokens: 10,
      lastRefillAt: new Date(BASE_DATE)
    };

    const { service, advanceHours } = createService(initialBucket);

    advanceHours(1);

    const state = await service.getBucketState('tenant-a');

    expect(state.availableTokens).toBe(10);
  });

  it('returns rate limited when tenant has no tokens', async () => {
    const initialBucket: BucketSnapshot = {
      tenantId: 'tenant-a',
      availableTokens: 0,
      maxTokens: 10,
      lastRefillAt: new Date(BASE_DATE)
    };

    const { service } = createService(initialBucket);

    const result = await service.queryPixKey('tenant-a', {
      pixKey: 'missing-key',
      amount: 10
    });

    expect(result.status).toBe('RATE_LIMITED');
    expect(result.consumedToken).toBe(false);
    expect(result.availableTokens).toBe(0);
  });
});
