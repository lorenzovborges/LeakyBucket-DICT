import pino from 'pino';

import { createApp } from './app';
import { loadEnv } from './config/env';
import { DictRateLimitService } from './modules/dict/dict-rate-limit.service';
import { LeakyBucketService } from './modules/leakybucket/leakybucket.service';
import { PixService } from './modules/pix/pix.service';
import { createSeedRepositories } from './seed';

const DEMO_TENANT_METADATA = {
  A: {
    name: 'Tenant A',
    category: 'A',
    capacity: '50,000'
  },
  B: {
    name: 'Tenant B',
    category: 'H',
    capacity: '50'
  }
} as const;

async function bootstrap() {
  const env = loadEnv();
  const logger = pino({ level: env.logLevel });

  const { tenantRepository, leakyBucketRepository, dictRepository } = createSeedRepositories({
    tenantAToken: env.demoTenantAToken,
    tenantBToken: env.demoTenantBToken
  });

  const pixService = new PixService();

  const leakyBucketService = new LeakyBucketService({
    repository: leakyBucketRepository,
    pixService,
    logger
  });

  const dictRateLimitService = new DictRateLimitService({
    repository: dictRepository,
    logger
  });

  const app = createApp({
    logger,
    tenantRepository,
    leakyBucketService,
    dictRateLimitService,
    graphqlMaskedErrors: env.graphqlMaskedErrors,
    demoLogin: {
      enabled: env.enableDemoLogin,
      tenants: {
        A: {
          ...DEMO_TENANT_METADATA.A,
          token: env.demoTenantAToken
        },
        B: {
          ...DEMO_TENANT_METADATA.B,
          token: env.demoTenantBToken
        }
      }
    }
  });

  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Leaky bucket backend listening');
  });

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutting down server');

    server.close(() => {
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => {
    shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
  });
}

void bootstrap();
