import { createTestApp, TEST_TENANTS } from './helpers/create-test-app';
import { graphqlRequest } from './helpers/graphql';

const SIMULATE_DICT_MUTATION = `
  mutation Simulate($input: SimulateDictOperationInput!) {
    simulateDictOperation(input: $input) {
      allowed
      httpStatus
      blockedByPolicies
      impacts {
        policyCode
        scopeType
        scopeKey
        tokensAfter
      }
    }
  }
`;

describe('DICT concurrency behavior', () => {
  it('keeps state consistent for concurrent failures in the same scope', async () => {
    const { request, repositories } = createTestApp();

    const responses = await Promise.all(
      Array.from({ length: 20 }).map((_, index) =>
        graphqlRequest({
          request,
          token: TEST_TENANTS.tenantB.token,
          query: SIMULATE_DICT_MUTATION,
          variables: {
            input: {
              operation: 'GET_ENTRY',
              simulatedStatusCode: 404,
              payerId: '12345678901',
              keyType: 'EMAIL',
              endToEndId: `E2E-CONCURRENT-${index}`
            }
          }
        })
      )
    );

    const allowedCount = responses.filter(
      (response) => response.body.data.simulateDictOperation.allowed === true
    ).length;
    const blockedCount = responses.filter(
      (response) => response.body.data.simulateDictOperation.allowed === false
    ).length;

    expect(allowedCount).toBe(5);
    expect(blockedCount).toBe(15);

    const userTokens = repositories.dictRepository.getBucketTokens({
      policyCode: 'ENTRIES_READ_USER_ANTISCAN',
      scopeType: 'USER',
      scopeKey: 'tenant-b:12345678901'
    });

    const pspTokens = repositories.dictRepository.getBucketTokens({
      policyCode: 'ENTRIES_READ_PARTICIPANT_ANTISCAN',
      scopeType: 'PSP',
      scopeKey: 'tenant-b'
    });

    expect(userTokens).toBe(0);
    expect(pspTokens).not.toBeNull();
    expect(pspTokens).toBeGreaterThanOrEqual(0);
  });

  it('keeps scopes isolated across tenants under concurrent traffic', async () => {
    const { request, repositories } = createTestApp();

    await Promise.all(
      Array.from({ length: 5 }).flatMap((_, index) => [
        graphqlRequest({
          request,
          token: TEST_TENANTS.tenantA.token,
          query: SIMULATE_DICT_MUTATION,
          variables: {
            input: {
              operation: 'GET_ENTRY',
              simulatedStatusCode: 200,
              payerId: '12345678901',
              keyType: 'EMAIL',
              endToEndId: `E2E-A-${index}`
            }
          }
        }),
        graphqlRequest({
          request,
          token: TEST_TENANTS.tenantB.token,
          query: SIMULATE_DICT_MUTATION,
          variables: {
            input: {
              operation: 'GET_ENTRY',
              simulatedStatusCode: 200,
              payerId: '12345678901',
              keyType: 'EMAIL',
              endToEndId: `E2E-B-${index}`
            }
          }
        })
      ])
    );

    const tenantAUserTokens = repositories.dictRepository.getBucketTokens({
      policyCode: 'ENTRIES_READ_USER_ANTISCAN',
      scopeType: 'USER',
      scopeKey: 'tenant-a:12345678901'
    });
    const tenantBUserTokens = repositories.dictRepository.getBucketTokens({
      policyCode: 'ENTRIES_READ_USER_ANTISCAN',
      scopeType: 'USER',
      scopeKey: 'tenant-b:12345678901'
    });

    expect(tenantAUserTokens).toBe(95);
    expect(tenantBUserTokens).toBe(95);
  });
});
