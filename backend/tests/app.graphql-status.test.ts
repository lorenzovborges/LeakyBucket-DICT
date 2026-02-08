import pino from 'pino';
import supertest from 'supertest';

import { hashToken } from '../src/modules/auth/token';
import type { DictRateLimitService } from '../src/modules/dict/dict-rate-limit.service';
import type { LeakyBucketService } from '../src/modules/leakybucket/leakybucket.service';
import type { AuthTenant, TenantRepository } from '../src/modules/tenant/tenant.repository';

const TEST_TOKEN = 'tenant-graphql-status-token';

const AUTH_TENANT: AuthTenant = {
  id: 'tenant-status',
  name: 'Tenant Status',
  tokenHash: hashToken(TEST_TOKEN),
  participantCode: 'PSP-H',
  participantCategory: 'H'
};

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

describe('GraphQL HTTP status adaptation', () => {
  it('keeps original HTTP status when GraphQL body is invalid JSON', async () => {
    jest.resetModules();
    jest.doMock('graphql-yoga', () => {
      const actual = jest.requireActual('graphql-yoga');

      return {
        ...actual,
        createYoga: () => ({
          handleNodeRequest: async () =>
            new Response('{invalid', {
              status: 200,
              headers: {
                'content-type': 'application/json; charset=utf-8'
              }
            })
        })
      };
    });

    const { createApp } = await import('../src/app');

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
      .post('/graphql')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({ query: 'query { health { status } }' })
      .buffer(true)
      .parse((res, callback) => {
        res.setEncoding('utf8');
        let data = '';

        res.on('data', (chunk: string) => {
          data += chunk;
        });

        res.on('end', () => {
          callback(null, data);
        });
      });

    expect(response.status).toBe(200);
    expect(response.body).toBe('{invalid');
  });
});
