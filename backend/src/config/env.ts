import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: string;
  databaseUrl: string;
  graphqlMaskedErrors: boolean;
  enableDemoLogin: boolean;
  demoTenantAToken: string;
  demoTenantBToken: string;
}

const DEFAULT_PORT = 4000;

function parseNodeEnv(value: string | undefined): EnvConfig['nodeEnv'] {
  if (value === 'production' || value === 'test' || value === 'development') {
    return value;
  }

  return 'development';
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
}

function parseGraphqlMaskedErrors(value: string | undefined): boolean {
  if (value === undefined) {
    return true;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error('Invalid GRAPHQL_MASKED_ERRORS value. Use "true" or "false".');
}

function parseBoolean(value: string | undefined, envName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`Invalid ${envName} value. Use "true" or "false".`);
}

function parseEnableDemoLogin(
  value: string | undefined,
  nodeEnv: EnvConfig['nodeEnv']
): boolean {
  const parsed = parseBoolean(value, 'ENABLE_DEMO_LOGIN');

  if (parsed !== undefined) {
    return parsed;
  }

  return nodeEnv !== 'production';
}

function parseDemoToken(value: string | undefined, envName: string, enabled: boolean): string {
  if (!enabled) {
    return value ?? '';
  }

  if (!value || value.trim().length === 0) {
    throw new Error(`${envName} is required when ENABLE_DEMO_LOGIN=true.`);
  }

  return value.trim();
}

export function loadEnv(): EnvConfig {
  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and set DATABASE_URL.');
  }

  const enableDemoLogin = parseEnableDemoLogin(process.env.ENABLE_DEMO_LOGIN, nodeEnv);

  return {
    port: parsePort(process.env.PORT),
    nodeEnv,
    logLevel: process.env.LOG_LEVEL ?? 'info',
    databaseUrl,
    graphqlMaskedErrors: parseGraphqlMaskedErrors(process.env.GRAPHQL_MASKED_ERRORS),
    enableDemoLogin,
    demoTenantAToken: parseDemoToken(
      process.env.DEMO_TENANT_A_TOKEN,
      'DEMO_TENANT_A_TOKEN',
      enableDemoLogin
    ),
    demoTenantBToken: parseDemoToken(
      process.env.DEMO_TENANT_B_TOKEN,
      'DEMO_TENANT_B_TOKEN',
      enableDemoLogin
    )
  };
}
