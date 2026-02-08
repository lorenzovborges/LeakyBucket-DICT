import dotenv from 'dotenv';

dotenv.config();

export interface EnvConfig {
  port: number;
  nodeEnv: 'development' | 'test' | 'production';
  logLevel: string;
  databaseUrl: string;
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

export function loadEnv(): EnvConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env and set DATABASE_URL.');
  }

  return {
    port: parsePort(process.env.PORT),
    nodeEnv: parseNodeEnv(process.env.NODE_ENV),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    databaseUrl
  };
}
