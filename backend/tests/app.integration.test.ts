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

const DEMO_LOGIN_CONFIG = {
  enabled: true,
  tenants: {
    A: {
      name: 'Tenant A',
      category: 'A',
      capacity: '50,000',
      token: 'tenant-a-secret'
    },
    B: {
      name: 'Tenant B',
      category: 'H',
      capacity: '50',
      token: 'tenant-b-secret'
    }
  }
} as const;

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
      graphqlMaskedErrors: true,
      demoLogin: DEMO_LOGIN_CONFIG
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
      graphqlMaskedErrors: true,
      demoLogin: DEMO_LOGIN_CONFIG
    });

    const response = await supertest(app.callback()).post('/graphql').send({
      query: 'query { myBucket { availableTokens } }'
    });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('returns demo token for selected tenant when demo login is enabled', async () => {
    const tenantRepository: TenantRepository = {
      findByTokenHash: jest.fn(async () => AUTH_TENANT)
    };

    const app = createApp({
      logger: pino({ enabled: false }),
      tenantRepository,
      leakyBucketService: createLeakyBucketServiceStub(),
      dictRateLimitService: createDictRateLimitServiceStub(),
      graphqlMaskedErrors: true,
      demoLogin: DEMO_LOGIN_CONFIG
    });

    const response = await supertest(app.callback())
      .post('/auth/demo-login')
      .set('Content-Type', 'application/json')
      .send({ tenantKey: 'A' });

    expect(response.status).toBe(200);
    expect(response.body.tenant).toEqual({
      name: 'Tenant A',
      category: 'A',
      capacity: '50,000'
    });
    expect(response.body.bearerToken).toBe('tenant-a-secret');
  });

  it('returns 404 when demo login endpoint is disabled', async () => {
    const tenantRepository: TenantRepository = {
      findByTokenHash: jest.fn(async () => AUTH_TENANT)
    };

    const app = createApp({
      logger: pino({ enabled: false }),
      tenantRepository,
      leakyBucketService: createLeakyBucketServiceStub(),
      dictRateLimitService: createDictRateLimitServiceStub(),
      graphqlMaskedErrors: true,
      demoLogin: {
        ...DEMO_LOGIN_CONFIG,
        enabled: false
      }
    });

    const response = await supertest(app.callback())
      .post('/auth/demo-login')
      .set('Content-Type', 'application/json')
      .send({ tenantKey: 'A' });

    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid demo login payload', async () => {
    const tenantRepository: TenantRepository = {
      findByTokenHash: jest.fn(async () => AUTH_TENANT)
    };

    const app = createApp({
      logger: pino({ enabled: false }),
      tenantRepository,
      leakyBucketService: createLeakyBucketServiceStub(),
      dictRateLimitService: createDictRateLimitServiceStub(),
      graphqlMaskedErrors: true,
      demoLogin: DEMO_LOGIN_CONFIG
    });

    const response = await supertest(app.callback())
      .post('/auth/demo-login')
      .set('Content-Type', 'application/json')
      .send({ tenantKey: 'C' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid payload. Expected {"tenantKey":"A"|"B"}');
  });

  it('returns 400 for malformed JSON on demo login', async () => {
    const tenantRepository: TenantRepository = {
      findByTokenHash: jest.fn(async () => AUTH_TENANT)
    };

    const app = createApp({
      logger: pino({ enabled: false }),
      tenantRepository,
      leakyBucketService: createLeakyBucketServiceStub(),
      dictRateLimitService: createDictRateLimitServiceStub(),
      graphqlMaskedErrors: true,
      demoLogin: DEMO_LOGIN_CONFIG
    });

    const response = await supertest(app.callback())
      .post('/auth/demo-login')
      .set('Content-Type', 'application/json')
      .send('{"tenantKey":"A"');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid JSON body. Expected {"tenantKey":"A"|"B"}');
  });
});
