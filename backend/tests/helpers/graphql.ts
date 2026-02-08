import type { Response } from 'supertest';

interface RequestBuilder extends Promise<Response> {
  set(field: string, value: string): Promise<Response>;
}

interface RequestClient {
  post(url: string): {
    send(body: Record<string, unknown>): RequestBuilder;
  };
}

interface GraphQLRequestOptions {
  request: RequestClient;
  query: string;
  variables?: Record<string, unknown>;
  token?: string;
}

export async function graphqlRequest(options: GraphQLRequestOptions): Promise<Response> {
  const requestBuilder = options.request.post('/graphql').send({
    query: options.query,
    variables: options.variables
  });

  if (!options.token) {
    return requestBuilder;
  }

  return requestBuilder.set('Authorization', `Bearer ${options.token}`);
}
