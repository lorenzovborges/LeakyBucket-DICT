import pino from 'pino';
import supertest from 'supertest';

import { createApp } from '../src/app';
import type { DictRateLimitService } from '../src/modules/dict/dict-rate-limit.service';
import type { LeakyBucketService } from '../src/modules/leakybucket/leakybucket.service';
import { hashToken } from '../src/modules/auth/token';
import type { AuthTenant, TenantRepository } from '../src/modules/tenant/tenant.repository';
import { createTestApp } from './helpers/create-test-app';

const TEST_TOKEN = 'tenant-test-token';

const AUTH_TENANT: AuthTenant = {
  id: 'tenant-app',
  name: 'Tenant App',
  tokenHash: hashToken(TEST_TOKEN),
  participantCode: 'PSP-H',
  participantCategory: 'H'
};

function createLeakyBucketServiceStub(): LeakyBucketService {
  return {
    getBucketState: jest.fn(),
    queryPixKey: jest.fn()
  } as unknown as LeakyBucketService;
}

function createDictRateLimitServiceStub(): DictRateLimitService {
  return {
    simulateOperation: jest.fn(),
    registerPaymentSent: jest.fn(),
    getBucketState: jest.fn(),
    listBucketStates: jest.fn()
  } as unknown as DictRateLimitService;
}

describe('App integration', () => {
  it('responds to GET /health', async () => {
    const { request } = createTestApp();

    const response = await request.get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('returns INTERNAL_ERROR payload when middleware chain throws', async () => {
    const tenantRepository: TenantRepository = {
      findByTokenHash: jest.fn(async () => {
        throw new Error('database temporarily unavailable');
      })
    };

    const app = createApp({
      logger: pino({ enabled: false }),
      tenantRepository,
      leakyBucketService: createLeakyBucketServiceStub(),
      dictRateLimitService: createDictRateLimitServiceStub(),
      graphqlMaskedErrors: true
    });

    const response = await supertest(app.callback())
      .post('/graphql')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({
        query: 'query { health { status } }'
      });

    expect(response.status).toBe(500);
    expect(response.body.errors[0].extensions.code).toBe('INTERNAL_ERROR');
    expect(response.body.errors[0].message).toBe('Internal server error');
  });

  it('returns UNAUTHENTICATED when Authorization header is missing for GraphQL', async () => {
    const tenantRepository: TenantRepository = {
      findByTokenHash: jest.fn(async () => AUTH_TENANT)
    };

    const app = createApp({
      logger: pino({ enabled: false }),
      tenantRepository,
      leakyBucketService: createLeakyBucketServiceStub(),
      dictRateLimitService: createDictRateLimitServiceStub(),
      graphqlMaskedErrors: true
    });

    const response = await supertest(app.callback()).post('/graphql').send({
      query: 'query { myBucket { availableTokens } }'
    });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
});
