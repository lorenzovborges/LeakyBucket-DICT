import { createTestApp, TEST_TENANTS } from './helpers/create-test-app';
import { graphqlRequest } from './helpers/graphql';

const SIMULATE_MUTATION = `
  mutation Simulate($input: SimulateDictOperationInput!) {
    simulateDictOperation(input: $input) {
      allowed
      httpStatus
      blockedByPolicies
      impacts {
        policyCode
        scopeType
        scopeKey
        costApplied
        tokensBefore
        tokensAfter
      }
    }
  }
`;

const REGISTER_PAYMENT_MUTATION = `
  mutation Register($input: RegisterPaymentSentInput!) {
    registerPaymentSent(input: $input) {
      credited
      reason
      impacts {
        policyCode
        costApplied
      }
    }
  }
`;

const BUCKET_QUERY = `
  query Bucket($input: DictBucketStateInput!) {
    dictBucketState(input: $input) {
      policyCode
      scopeType
      scopeKey
      tokens
      capacity
      refillPerSecond
      lastRefillAt
    }
  }
`;

const LIST_BUCKETS_QUERY = `
  query ListBuckets($policyCode: DictPolicyCode, $scopeType: DictScopeType) {
    listDictBucketStates(policyCode: $policyCode, scopeType: $scopeType) {
      policyCode
      scopeType
      scopeKey
      tokens
      capacity
    }
  }
`;

describe('DICT GraphQL integration', () => {
  it('returns UNAUTHENTICATED for DICT operations without bearer token', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'CHECK_KEYS',
          simulatedStatusCode: 200
        }
      }
    });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('validates required fields for getEntry', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'GET_ENTRY',
          simulatedStatusCode: 200,
          keyType: 'EMAIL',
          endToEndId: 'E2E-1'
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  it('validates required hasRoleFilter field for list operations', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'LIST_CLAIMS',
          simulatedStatusCode: 200
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    expect(response.body.errors[0].message).toContain('hasRoleFilter');
  });

  it('simulates operation, exposes bucket state and applies payment credit', async () => {
    const { request } = createTestApp();

    const simulate = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'GET_ENTRY',
          simulatedStatusCode: 200,
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-graphql'
        }
      }
    });

    expect(simulate.body.data.simulateDictOperation.allowed).toBe(true);
    expect(simulate.body.data.simulateDictOperation.httpStatus).toBe(200);

    const bucketBeforeCredit = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: BUCKET_QUERY,
      variables: {
        input: {
          policyCode: 'ENTRIES_READ_USER_ANTISCAN',
          scopeType: 'USER',
          scopeKey: 'tenant-a:12345678901'
        }
      }
    });

    expect(bucketBeforeCredit.body.data.dictBucketState.tokens).toBe(99);

    const credit = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: REGISTER_PAYMENT_MUTATION,
      variables: {
        input: {
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-graphql'
        }
      }
    });

    expect(credit.body.data.registerPaymentSent.credited).toBe(true);

    const bucketAfterCredit = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: BUCKET_QUERY,
      variables: {
        input: {
          policyCode: 'ENTRIES_READ_USER_ANTISCAN',
          scopeType: 'USER',
          scopeKey: 'tenant-a:12345678901'
        }
      }
    });

    expect(bucketAfterCredit.body.data.dictBucketState.tokens).toBe(100);
  });

  it('returns 429 with payload details when policy balance is exhausted', async () => {
    const { request } = createTestApp();

    for (let index = 0; index < 5; index += 1) {
      await graphqlRequest({
        request,
        token: TEST_TENANTS.tenantB.token,
        query: SIMULATE_MUTATION,
        variables: {
          input: {
            operation: 'GET_ENTRY',
            simulatedStatusCode: 404,
            payerId: '12345678901',
            keyType: 'EMAIL',
            endToEndId: `E2E-${index}`
          }
        }
      });
    }

    const blocked = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantB.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'GET_ENTRY',
          simulatedStatusCode: 404,
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-final'
        }
      }
    });

    expect(blocked.status).toBe(429);
    expect(blocked.body.data.simulateDictOperation.allowed).toBe(false);
    expect(blocked.body.data.simulateDictOperation.httpStatus).toBe(429);
    expect(blocked.body.data.simulateDictOperation.blockedByPolicies).toContain(
      'ENTRIES_READ_USER_ANTISCAN'
    );
  });

  it('returns BAD_USER_INPUT when dictBucketState scopeKey does not belong to tenant', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: BUCKET_QUERY,
      variables: {
        input: {
          policyCode: 'ENTRIES_READ_USER_ANTISCAN',
          scopeType: 'USER',
          scopeKey: 'tenant-b:12345678901'
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
  });

  it('lists DICT bucket states with and without filters', async () => {
    const { request } = createTestApp();

    await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'GET_ENTRY',
          simulatedStatusCode: 200,
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-listing-1'
        }
      }
    });

    await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'CHECK_KEYS',
          simulatedStatusCode: 200
        }
      }
    });

    const filtered = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: LIST_BUCKETS_QUERY,
      variables: {
        policyCode: 'ENTRIES_READ_USER_ANTISCAN',
        scopeType: 'USER'
      }
    });

    const all = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: LIST_BUCKETS_QUERY
    });

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.listDictBucketStates).toHaveLength(1);
    expect(filtered.body.data.listDictBucketStates[0].policyCode).toBe(
      'ENTRIES_READ_USER_ANTISCAN'
    );
    expect(all.status).toBe(200);
    expect(all.body.data.listDictBucketStates.length).toBeGreaterThan(1);
  });

  it('does not apply payment credit for ineligible lookup traces', async () => {
    const { request } = createTestApp();

    await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: SIMULATE_MUTATION,
      variables: {
        input: {
          operation: 'GET_ENTRY',
          simulatedStatusCode: 404,
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-ineligible'
        }
      }
    });

    const credit = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: REGISTER_PAYMENT_MUTATION,
      variables: {
        input: {
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-ineligible'
        }
      }
    });

    expect(credit.status).toBe(200);
    expect(credit.body.data.registerPaymentSent.credited).toBe(false);
    expect(credit.body.data.registerPaymentSent.reason).toBe('ENTRY_LOOKUP_NOT_ELIGIBLE');
    expect(credit.body.data.registerPaymentSent.impacts).toHaveLength(0);
  });
});
