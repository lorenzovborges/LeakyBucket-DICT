import { PrismaClient } from '@prisma/client';
import pino from 'pino';

import { createApp } from './app';
import { loadEnv } from './config/env';
import { DictRateLimitService } from './modules/dict/dict-rate-limit.service';
import { PrismaDictRepository } from './modules/dict/dict.repository';
import { PrismaLeakyBucketRepository } from './modules/leakybucket/leakybucket.repository';
import { LeakyBucketService } from './modules/leakybucket/leakybucket.service';
import { PixService } from './modules/pix/pix.service';
import { PrismaTenantRepository } from './modules/tenant/tenant.repository';

async function bootstrap() {
  const env = loadEnv();
  const logger = pino({ level: env.logLevel });
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.databaseUrl
      }
    }
  });

  const tenantRepository = new PrismaTenantRepository(prisma);
  const leakyBucketRepository = new PrismaLeakyBucketRepository(prisma);
  const dictRepository = new PrismaDictRepository(prisma);
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
    dictRateLimitService
  });

  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Leaky bucket backend listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down server');

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void bootstrap();
