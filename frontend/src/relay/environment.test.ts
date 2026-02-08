import { describe, expect, it, vi, afterEach } from 'vitest';
import type { RequestParameters, Variables } from 'relay-runtime';

import { createFetchFn } from './environment';

const TEST_OPERATION: RequestParameters = {
  cacheID: 'test-cache',
  id: null,
  metadata: {},
  name: 'TestOperation',
  operationKind: 'query',
  text: 'query TestOperation { health { status } }',
};

const TEST_VARIABLES: Variables = {};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Relay environment fetch function', () => {
  it('calls onUnauthenticated and throws when HTTP status is 401', async () => {
    const onUnauthenticated = vi.fn();
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          errors: [{ message: 'Authentication failed' }],
        }),
        { status: 401 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const fetchFn = createFetchFn('token-a', { onUnauthenticated });

    await expect(fetchFn(TEST_OPERATION, TEST_VARIABLES, {})).rejects.toThrow(
      'Authentication failed',
    );
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('calls onUnauthenticated and throws when GraphQL payload contains UNAUTHENTICATED', async () => {
    const onUnauthenticated = vi.fn();
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          errors: [
            {
              message: 'Authentication required',
              extensions: { code: 'UNAUTHENTICATED' },
            },
          ],
        }),
        { status: 200 },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    const fetchFn = createFetchFn('token-b', { onUnauthenticated });

    await expect(fetchFn(TEST_OPERATION, TEST_VARIABLES, {})).rejects.toThrow(
      'Authentication failed',
    );
    expect(onUnauthenticated).toHaveBeenCalledTimes(1);
  });

  it('returns 429 DICT payload without triggering logout', async () => {
    const onUnauthenticated = vi.fn();
    const payload = {
      data: {
        simulateDictOperation: {
          allowed: false,
          httpStatus: 429,
          blockedByPolicies: ['ENTRIES_READ_USER_ANTISCAN'],
          impacts: [],
        },
      },
    };
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status: 429,
      }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const fetchFn = createFetchFn('token-c', { onUnauthenticated });
    const result = await fetchFn(TEST_OPERATION, TEST_VARIABLES, {});

    expect(result).toEqual(payload);
    expect(onUnauthenticated).not.toHaveBeenCalled();
  });

  it('throws controlled error for invalid JSON payloads', async () => {
    const fetchMock = vi.fn(async () => new Response('not-json', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const fetchFn = createFetchFn('token-d');

    await expect(fetchFn(TEST_OPERATION, TEST_VARIABLES, {})).rejects.toThrow(
      'Invalid JSON response from GraphQL endpoint',
    );
  });
});
