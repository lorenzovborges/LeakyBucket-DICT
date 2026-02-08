import { loadEnv } from '../src/config/env';

const ORIGINAL_ENV = process.env;

function setupBaseEnv() {
  process.env = {
    ...ORIGINAL_ENV,
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/leakybucket?schema=public',
    DEMO_TENANT_A_TOKEN: 'tenant-a-secret',
    DEMO_TENANT_B_TOKEN: 'tenant-b-secret'
  };
  delete process.env.PORT;
  delete process.env.NODE_ENV;
  delete process.env.LOG_LEVEL;
  delete process.env.ENABLE_DEMO_LOGIN;
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

  it('enables demo login by default in development and test envs', () => {
    setupBaseEnv();
    process.env.NODE_ENV = 'development';
    expect(loadEnv().enableDemoLogin).toBe(true);

    setupBaseEnv();
    process.env.NODE_ENV = 'test';
    expect(loadEnv().enableDemoLogin).toBe(true);
  });

  it('disables demo login by default in production', () => {
    setupBaseEnv();
    process.env.NODE_ENV = 'production';

    const env = loadEnv();

    expect(env.enableDemoLogin).toBe(false);
  });

  it('fails fast when demo login is enabled without tenant tokens', () => {
    setupBaseEnv();
    process.env.ENABLE_DEMO_LOGIN = 'true';
    delete process.env.DEMO_TENANT_A_TOKEN;

    expect(() => loadEnv()).toThrow('DEMO_TENANT_A_TOKEN is required when ENABLE_DEMO_LOGIN=true.');
  });

  it('fails fast when ENABLE_DEMO_LOGIN has invalid value', () => {
    setupBaseEnv();
    process.env.ENABLE_DEMO_LOGIN = 'yes';

    expect(() => loadEnv()).toThrow('Invalid ENABLE_DEMO_LOGIN value. Use "true" or "false".');
  });
});
