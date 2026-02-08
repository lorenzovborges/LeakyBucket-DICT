import { createTestApp, TEST_TENANTS } from './helpers/create-test-app';
import { graphqlRequest } from './helpers/graphql';

const QUERY_PIX_MUTATION = `
  mutation QueryPix($input: QueryPixKeyInput!) {
    queryPixKey(input: $input) {
      status
      availableTokens
    }
  }
`;

const MY_BUCKET_QUERY = `
  query {
    myBucket {
      availableTokens
      maxTokens
    }
  }
`;

describe('Concurrency behavior', () => {
  it('keeps token state consistent under concurrent failed requests', async () => {
    const { request, repositories } = createTestApp();

    const concurrentRequests = Array.from({ length: 15 }).map((_, index) =>
      graphqlRequest({
        request,
        token: TEST_TENANTS.tenantA.token,
        query: QUERY_PIX_MUTATION,
        variables: {
          input: {
            pixKey: `missing-concurrent-${index}`,
            amountCents: 100
          }
        }
      })
    );

    const responses = await Promise.all(concurrentRequests);
    const statuses = responses.map((response) => response.body.data.queryPixKey.status as string);

    const failedCount = statuses.filter((status) => status === 'FAILED').length;
    const limitedCount = statuses.filter((status) => status === 'RATE_LIMITED').length;

    expect(failedCount).toBe(10);
    expect(limitedCount).toBe(5);

    const finalState = await graphqlRequest({
      request,
      token: TEST_TENANTS.tenantA.token,
      query: MY_BUCKET_QUERY
    });

    expect(finalState.body.data.myBucket.availableTokens).toBe(0);

    const attempts = repositories.leakyBucketRepository.getAttemptsForTenant(TEST_TENANTS.tenantA.id);
    const hasNegativeTokenAttempt = attempts.some((attempt) => attempt.tokensAfter < 0);

    expect(hasNegativeTokenAttempt).toBe(false);
  });
});
