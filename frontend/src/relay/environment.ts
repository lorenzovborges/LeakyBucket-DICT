import {
  Environment,
  Network,
  RecordSource,
  Store,
  type FetchFunction,
  type GraphQLResponse,
  type RequestParameters,
  type Variables,
} from 'relay-runtime';

interface RelayEnvironmentOptions {
  onUnauthenticated?: () => void;
}

interface GraphQLErrorExtension {
  code?: string;
}

interface GraphQLErrorPayload {
  extensions?: GraphQLErrorExtension;
}

interface GraphQLPayload {
  data?: unknown;
  errors?: GraphQLErrorPayload[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseGraphQLPayload(rawBody: string): GraphQLPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new Error('Invalid JSON response from GraphQL endpoint');
  }

  if (!isRecord(parsed)) {
    throw new Error('Invalid GraphQL response shape');
  }

  const payload: GraphQLPayload = {};

  if ('data' in parsed) {
    payload.data = parsed.data;
  }

  if ('errors' in parsed && Array.isArray(parsed.errors)) {
    payload.errors = parsed.errors.filter(isRecord).map((error) => ({
      extensions: isRecord(error.extensions)
        ? {
            code:
              typeof error.extensions.code === 'string'
                ? error.extensions.code
                : undefined,
          }
        : undefined,
    }));
  }

  return payload;
}

function hasUnauthenticatedError(payload: GraphQLPayload): boolean {
  if (!payload.errors) {
    return false;
  }

  return payload.errors.some((error) => error.extensions?.code === 'UNAUTHENTICATED');
}

export function createFetchFn(
  token: string,
  options: RelayEnvironmentOptions = {},
): FetchFunction {
  return async (
    operation: RequestParameters,
    variables: Variables,
  ): Promise<GraphQLResponse> => {
    if (!operation.text) {
      throw new Error('GraphQL operation text is empty');
    }

    const response = await fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: operation.text,
        variables,
      }),
    });

    const bodyText = await response.text();
    const payload = parseGraphQLPayload(bodyText);
    const unauthenticated =
      response.status === 401 || hasUnauthenticatedError(payload);

    if (unauthenticated) {
      options.onUnauthenticated?.();
      throw new Error('Authentication failed');
    }

    if (!response.ok && response.status !== 429) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    return payload as GraphQLResponse;
  };
}

export function createRelayEnvironment(
  token: string,
  options: RelayEnvironmentOptions = {},
): Environment {
  return new Environment({
    network: Network.create(createFetchFn(token, options)),
    store: new Store(new RecordSource()),
  });
}
