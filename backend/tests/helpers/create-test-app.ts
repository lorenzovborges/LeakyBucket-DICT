import pino from 'pino';
import supertest from 'supertest';

import { createApp } from '../../src/app';
import { DictRateLimitService } from '../../src/modules/dict/dict-rate-limit.service';
import { LeakyBucketService } from '../../src/modules/leakybucket/leakybucket.service';
import { PixService } from '../../src/modules/pix/pix.service';
import {
  InMemoryLeakyBucketRepository,
  InMemoryTenantRepository
} from './in-memory-repositories';
import { InMemoryDictRepository } from './in-memory-dict-repository';

export const TEST_TENANTS = {
  tenantA: {
    id: 'tenant-a',
    name: 'Tenant A',
    token: 'tenant-a-secret',
    participantCode: 'PSP-A',
    participantCategory: 'A' as const
  },
  tenantB: {
    id: 'tenant-b',
    name: 'Tenant B',
    token: 'tenant-b-secret',
    participantCode: 'PSP-H',
    participantCategory: 'H' as const
  }
};

export class MutableClock {
  constructor(private current: Date) {}

  now = (): Date => {
    return new Date(this.current);
  };

  addHours(hours: number): void {
    this.current = new Date(this.current.getTime() + hours * 60 * 60 * 1000);
  }
}

interface CreateTestAppOptions {
  initialDate?: Date;
}

export function createTestApp(options: CreateTestAppOptions = {}) {
  const clock = new MutableClock(options.initialDate ?? new Date('2026-01-01T00:00:00.000Z'));

  const tenantRepository = new InMemoryTenantRepository([
    TEST_TENANTS.tenantA,
    TEST_TENANTS.tenantB
  ]);

  const leakyBucketRepository = new InMemoryLeakyBucketRepository({
    buckets: [
      {
        tenantId: TEST_TENANTS.tenantA.id,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: clock.now()
      },
      {
        tenantId: TEST_TENANTS.tenantB.id,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: clock.now()
      }
    ],
    pixKeys: [
      {
        key: 'valid-pix-key-001',
        ownerName: 'Joao Silva',
        bankName: 'Leaky Bank',
        status: 'ACTIVE'
      },
      {
        key: 'inactive-pix-key-003',
        ownerName: 'Conta Inativa',
        bankName: 'Legacy Bank',
        status: 'INACTIVE'
      }
    ]
  });

  const logger = pino({ enabled: false });
  const dictRepository = new InMemoryDictRepository();

  const leakyBucketService = new LeakyBucketService({
    repository: leakyBucketRepository,
    pixService: new PixService(),
    logger,
    clock: clock.now
  });

  const dictRateLimitService = new DictRateLimitService({
    repository: dictRepository,
    logger,
    clock: clock.now
  });

  const app = createApp({
    logger,
    tenantRepository,
    leakyBucketService,
    dictRateLimitService,
    graphqlMaskedErrors: true,
    demoLogin: {
      enabled: true,
      tenants: {
        A: {
          name: TEST_TENANTS.tenantA.name,
          category: TEST_TENANTS.tenantA.participantCategory,
          capacity: '50,000',
          token: TEST_TENANTS.tenantA.token
        },
        B: {
          name: TEST_TENANTS.tenantB.name,
          category: TEST_TENANTS.tenantB.participantCategory,
          capacity: '50',
          token: TEST_TENANTS.tenantB.token
        }
      }
    }
  });

  return {
    app,
    request: supertest(app.callback()),
    clock,
    repositories: {
      tenantRepository,
      leakyBucketRepository,
      dictRepository
    }
  };
}
