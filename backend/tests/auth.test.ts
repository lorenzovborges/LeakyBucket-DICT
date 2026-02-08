import { createTestApp, TEST_TENANTS } from './helpers/create-test-app';
import { graphqlRequest } from './helpers/graphql';

const MY_BUCKET_QUERY = `
  query {
    myBucket {
      availableTokens
      maxTokens
      lastRefillAt
    }
  }
`;

describe('Authentication middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      query: MY_BUCKET_QUERY
    });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 when token is invalid', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      query: MY_BUCKET_QUERY,
      token: 'invalid-token'
    });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('authenticates valid bearer token and resolves tenant bucket', async () => {
    const { request } = createTestApp();

    const response = await graphqlRequest({
      request,
      query: MY_BUCKET_QUERY,
      token: TEST_TENANTS.tenantA.token
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myBucket.availableTokens).toBe(10);
    expect(response.body.data.myBucket.maxTokens).toBe(10);
  });

  it('accepts lowercase bearer scheme', async () => {
    const { request } = createTestApp();

    const response = await request
      .post('/graphql')
      .set('Authorization', `bearer ${TEST_TENANTS.tenantA.token}`)
      .send({
        query: MY_BUCKET_QUERY
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
  });

  it('accepts uppercase bearer scheme and extra internal spaces', async () => {
    const { request } = createTestApp();

    const response = await request
      .post('/graphql')
      .set('Authorization', `   BEARER   ${TEST_TENANTS.tenantA.token}   `)
      .send({
        query: MY_BUCKET_QUERY
      });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
  });

  it('returns 401 for malformed authorization header with extra segments', async () => {
    const { request } = createTestApp();

    const response = await request
      .post('/graphql')
      .set('Authorization', `Bearer ${TEST_TENANTS.tenantA.token} extra`)
      .send({
        query: MY_BUCKET_QUERY
      });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for empty bearer token', async () => {
    const { request } = createTestApp();

    const response = await request
      .post('/graphql')
      .set('Authorization', 'Bearer    ')
      .send({
        query: MY_BUCKET_QUERY
      });

    expect(response.status).toBe(401);
    expect(response.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
  });
});
