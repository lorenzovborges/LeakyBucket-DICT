import { createTestApp, TEST_TENANTS } from './helpers/create-test-app';
import { graphqlRequest } from './helpers/graphql';

const QUERY_PIX_MUTATION = `
  mutation QueryPix($input: QueryPixKeyInput!) {
    queryPixKey(input: $input) {
      status
      message
      pixKeyFound
      ownerName
      bankName
      availableTokens
      maxTokens
      consumedToken
      requestedAt
    }
  }
`;

const MY_BUCKET_QUERY = `
  query {
    myBucket {
      availableTokens
      maxTokens
      lastRefillAt
    }
  }
`;

describe('GraphQL integration', () => {
  it('returns SUCCESS for active pix key and keeps token count', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: QUERY_PIX_MUTATION,
      variables: {
        input: {
          pixKey: 'valid-pix-key-001',
          amount: 100
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.data.queryPixKey.status).toBe('SUCCESS');
    expect(response.body.data.queryPixKey.consumedToken).toBe(false);
    expect(response.body.data.queryPixKey.availableTokens).toBe(10);
  });

  it('returns FAILED for missing pix key and consumes one token', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: QUERY_PIX_MUTATION,
      variables: {
        input: {
          pixKey: 'missing-pix-key-123',
          amount: 50
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.data.queryPixKey.status).toBe('FAILED');
    expect(response.body.data.queryPixKey.consumedToken).toBe(true);
    expect(response.body.data.queryPixKey.availableTokens).toBe(9);
  });

  it('isolates bucket state between tenants', async () => {
    const { request } = createTestApp();

    await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: QUERY_PIX_MUTATION,
      variables: {
        input: {
          pixKey: 'missing-pix-key-123',
          amount: 1
        }
      }
    });

    const tenantAState = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: MY_BUCKET_QUERY
    });

    const tenantBState = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantB.token,
      query: MY_BUCKET_QUERY
    });

    expect(tenantAState.body.data.myBucket.availableTokens).toBe(9);
    expect(tenantBState.body.data.myBucket.availableTokens).toBe(10);
  });

  it('returns RATE_LIMITED after consuming all tokens with failures', async () => {
    const { request } = createTestApp();

    for (let i = 0; i < 10; i += 1) {
      await graphqlRequest({
        request,
        token: TEST_TENANTS.tenantA.token,
        query: QUERY_PIX_MUTATION,
        variables: {
          input: {
            pixKey: `missing-${i}`,
            amount: 1
          }
        }
      });
    }

    const rateLimited = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: QUERY_PIX_MUTATION,
      variables: {
        input: {
          pixKey: 'missing-final',
          amount: 1
        }
      }
    });

    expect(rateLimited.body.data.queryPixKey.status).toBe('RATE_LIMITED');
    expect(rateLimited.body.data.queryPixKey.availableTokens).toBe(0);
    expect(rateLimited.body.data.queryPixKey.consumedToken).toBe(false);
  });

  it('returns BAD_USER_INPUT when amount is zero', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: QUERY_PIX_MUTATION,
      variables: {
        input: {
          pixKey: 'valid-pix-key-001',
          amount: 0
        }
      }
    });

    expect(response.status).toBe(200);
    expect(response.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
    expect(response.body.errors[0].message).toBe('Amount must be greater than zero');
  });
});
