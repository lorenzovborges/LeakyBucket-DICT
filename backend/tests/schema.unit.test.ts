import pino from 'pino';
import {
  graphql,
  GraphQLScalarType,
  Kind,
  type IntValueNode,
  type StringValueNode
} from 'graphql';

import type { GraphQLContext } from '../src/graphql/context';
import { createGraphQLSchema } from '../src/graphql/schema';
import { DictValidationError } from '../src/modules/dict/dict.types';
import type { DictRateLimitService } from '../src/modules/dict/dict-rate-limit.service';
import type { LeakyBucketService } from '../src/modules/leakybucket/leakybucket.service';
import type { AuthTenant } from '../src/modules/tenant/tenant.repository';

const AUTH_TENANT: AuthTenant = {
  id: 'tenant-schema',
  name: 'Tenant Schema',
  tokenHash: 'hash',
  participantCode: 'PSP-H',
  participantCategory: 'H'
};

function createLeakyBucketServiceStub(): LeakyBucketService {
  return {
    getBucketState: jest.fn(async () => ({
      availableTokens: 10,
      maxTokens: 10,
      lastRefillAt: new Date('2026-01-01T00:00:00.000Z')
    })),
    queryPixKey: jest.fn(async () => ({
      status: 'SUCCESS',
      message: 'ok',
      pixKeyFound: true,
      ownerName: 'Owner',
      bankName: 'Bank',
      availableTokens: 10,
      maxTokens: 10,
      consumedToken: false,
      requestedAt: new Date('2026-01-01T00:00:00.000Z')
    }))
  } as unknown as LeakyBucketService;
}

function createDictRateLimitServiceStub(): DictRateLimitService {
  return {
    simulateOperation: jest.fn(async () => ({
      allowed: true,
      httpStatus: 200,
      blockedByPolicies: [],
      impacts: []
    })),
    registerPaymentSent: jest.fn(async () => ({
      credited: true,
      reason: 'CREDIT_APPLIED',
      impacts: []
    })),
    getBucketState: jest.fn(async () => null),
    listBucketStates: jest.fn(async () => [])
  } as unknown as DictRateLimitService;
}

function createContext(overrides?: Partial<GraphQLContext>): GraphQLContext {
  return {
    tenant: AUTH_TENANT,
    requestId: 'test-request',
    logger: pino({ enabled: false }),
    leakyBucketService: createLeakyBucketServiceStub(),
    dictRateLimitService: createDictRateLimitServiceStub(),
    ...overrides
  };
}

describe('GraphQL schema unit behavior', () => {
  it('returns UNAUTHENTICATED when tenant is missing inside resolver context', async () => {
    const schema = createGraphQLSchema();

    const result = await graphql({
      schema,
      source: 'query { myBucket { availableTokens } }',
      contextValue: createContext({ tenant: null })
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('returns BAD_USER_INPUT when amount is zero or negative', async () => {
    const schema = createGraphQLSchema();

    const result = await graphql({
      schema,
      source:
        'mutation QueryPix($input: QueryPixKeyInput!) { queryPixKey(input: $input) { status } }',
      variableValues: {
        input: {
          pixKey: 'valid-pix-key-001',
          amount: 0
        }
      },
      contextValue: createContext()
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
    expect(result.errors?.[0]?.message).toBe('Amount must be greater than zero');
  });

  it('maps DictValidationError to BAD_USER_INPUT for dictBucketState', async () => {
    const schema = createGraphQLSchema();
    const dictRateLimitService = createDictRateLimitServiceStub();

    (
      dictRateLimitService.getBucketState as jest.MockedFunction<
        DictRateLimitService['getBucketState']
      >
    ).mockRejectedValueOnce(new DictValidationError('scopeKey is invalid'));

    const result = await graphql({
      schema,
      source:
        'query Bucket($input: DictBucketStateInput!) { dictBucketState(input: $input) { policyCode } }',
      variableValues: {
        input: {
          policyCode: 'ENTRIES_READ_USER_ANTISCAN',
          scopeType: 'USER',
          scopeKey: 'other-tenant:12345678901'
        }
      },
      contextValue: createContext({ dictRateLimitService })
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
  });

  it('rethrows unknown errors from DICT resolver path', async () => {
    const schema = createGraphQLSchema();
    const dictRateLimitService = createDictRateLimitServiceStub();

    (
      dictRateLimitService.simulateOperation as jest.MockedFunction<
        DictRateLimitService['simulateOperation']
      >
    ).mockRejectedValueOnce(new Error('unexpected-failure'));

    const result = await graphql({
      schema,
      source:
        'mutation Simulate($input: SimulateDictOperationInput!) { simulateDictOperation(input: $input) { allowed } }',
      variableValues: {
        input: {
          operation: 'CHECK_KEYS',
          simulatedStatusCode: 200
        }
      },
      contextValue: createContext({ dictRateLimitService })
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toBe('unexpected-failure');
  });

  it('maps DictValidationError to BAD_USER_INPUT for registerPaymentSent', async () => {
    const schema = createGraphQLSchema();
    const dictRateLimitService = createDictRateLimitServiceStub();

    (
      dictRateLimitService.registerPaymentSent as jest.MockedFunction<
        DictRateLimitService['registerPaymentSent']
      >
    ).mockRejectedValueOnce(new DictValidationError('invalid register input'));

    const result = await graphql({
      schema,
      source:
        'mutation Register($input: RegisterPaymentSentInput!) { registerPaymentSent(input: $input) { credited reason } }',
      variableValues: {
        input: {
          payerId: '123',
          keyType: 'EMAIL',
          endToEndId: 'E2E-register-validation'
        }
      },
      contextValue: createContext({ dictRateLimitService })
    });

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
  });

  it('covers DateTime scalar serialize and parse error branches', () => {
    const schema = createGraphQLSchema();
    const scalar = schema.getType('DateTime');

    expect(scalar).toBeInstanceOf(GraphQLScalarType);

    const dateTimeScalar = scalar as GraphQLScalarType;
    const validDate = new Date('2026-01-01T00:00:00.000Z');
    const validAst: StringValueNode = {
      kind: Kind.STRING,
      value: validDate.toISOString()
    };
    const invalidKindAst: IntValueNode = {
      kind: Kind.INT,
      value: '1'
    };

    expect(dateTimeScalar.serialize(validDate)).toBe(validDate.toISOString());
    expect(() => dateTimeScalar.serialize('invalid')).toThrow(
      'DateTime can only serialize Date values'
    );

    expect(dateTimeScalar.parseValue(validDate.toISOString())).toBeInstanceOf(Date);
    expect(() => dateTimeScalar.parseValue(1)).toThrow('DateTime can only parse string values');
    expect(() => dateTimeScalar.parseValue('not-a-date')).toThrow('Invalid DateTime value');

    expect(dateTimeScalar.parseLiteral(validAst)).toBeInstanceOf(Date);
    expect(() => dateTimeScalar.parseLiteral(invalidKindAst)).toThrow(
      'DateTime can only parse string literals'
    );
    expect(() => dateTimeScalar.parseLiteral({ kind: Kind.STRING, value: 'not-a-date' })).toThrow(
      'Invalid DateTime value'
    );
  });

  it('resolves health and listDictBucketStates with and without filters', async () => {
    const schema = createGraphQLSchema();
    const dictRateLimitService = createDictRateLimitServiceStub();

    (
      dictRateLimitService.listBucketStates as jest.MockedFunction<
        DictRateLimitService['listBucketStates']
      >
    ).mockResolvedValue([
      {
        policyCode: 'KEYS_CHECK',
        scopeType: 'PSP',
        scopeKey: AUTH_TENANT.id,
        tokens: 60,
        capacity: 70,
        refillPerSecond: 70 / 60,
        lastRefillAt: new Date('2026-01-01T00:00:00.000Z')
      }
    ]);

    const healthResult = await graphql({
      schema,
      source: 'query { health { status timestamp } }',
      contextValue: createContext()
    });

    expect(healthResult.errors).toBeUndefined();
    expect(healthResult.data).toBeDefined();
    expect((healthResult.data as { health: { status: string } }).health.status).toBe('ok');

    const filteredResult = await graphql({
      schema,
      source:
        'query($policyCode: DictPolicyCode, $scopeType: DictScopeType) { listDictBucketStates(policyCode: $policyCode, scopeType: $scopeType) { policyCode } }',
      variableValues: {
        policyCode: 'KEYS_CHECK',
        scopeType: 'PSP'
      },
      contextValue: createContext({ dictRateLimitService })
    });

    const unfilteredResult = await graphql({
      schema,
      source: 'query { listDictBucketStates { policyCode } }',
      contextValue: createContext({ dictRateLimitService })
    });

    expect(filteredResult.errors).toBeUndefined();
    expect(unfilteredResult.errors).toBeUndefined();
    expect(
      (filteredResult.data as { listDictBucketStates: Array<{ policyCode: string }> })
        .listDictBucketStates[0].policyCode
    ).toBe('KEYS_CHECK');
    expect(
      (unfilteredResult.data as { listDictBucketStates: Array<{ policyCode: string }> })
        .listDictBucketStates[0].policyCode
    ).toBe('KEYS_CHECK');
  });
});
