import { loadEnv } from '../src/config/env';

const ORIGINAL_ENV = process.env;

function setupBaseEnv() {
  process.env = {
    ...ORIGINAL_ENV,
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/leakybucket?schema=public'
  };
  delete process.env.PORT;
  delete process.env.NODE_ENV;
  delete process.env.LOG_LEVEL;
}

describe('Environment configuration', () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('defaults GRAPHQL_MASKED_ERRORS to true when undefined', () => {
    setupBaseEnv();
    delete process.env.GRAPHQL_MASKED_ERRORS;

    const env = loadEnv();

    expect(env.graphqlMaskedErrors).toBe(true);
  });

  it('parses GRAPHQL_MASKED_ERRORS=false explicitly', () => {
    setupBaseEnv();
    process.env.GRAPHQL_MASKED_ERRORS = 'false';

    const env = loadEnv();

    expect(env.graphqlMaskedErrors).toBe(false);
  });

  it('fails fast when GRAPHQL_MASKED_ERRORS has invalid value', () => {
    setupBaseEnv();
    process.env.GRAPHQL_MASKED_ERRORS = 'invalid';

    expect(() => loadEnv()).toThrow('Invalid GRAPHQL_MASKED_ERRORS value. Use "true" or "false".');
  });
});
