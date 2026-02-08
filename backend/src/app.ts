import { randomUUID } from 'node:crypto';

import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import { createYoga } from 'graphql-yoga';
import type { Logger } from 'pino';

import { createGraphQLSchema } from './graphql/schema';
import { buildGraphQLContext, type GraphQLContext, type YogaServerContext } from './graphql/context';
import { createAuthMiddleware } from './modules/auth/auth.middleware';
import type { DictRateLimitService } from './modules/dict/dict-rate-limit.service';
import type { LeakyBucketService } from './modules/leakybucket/leakybucket.service';
import type { TenantRepository } from './modules/tenant/tenant.repository';
import type { AppState } from './types/app';

export interface AppDependencies {
  logger: Logger;
  tenantRepository: TenantRepository;
  leakyBucketService: LeakyBucketService;
  dictRateLimitService: DictRateLimitService;
}

interface GraphQLResponsePayload {
  data?: {
    simulateDictOperation?: {
      allowed?: boolean;
      httpStatus?: number;
    };
  };
}

export function createApp(deps: AppDependencies): Koa<AppState> {
  const app = new Koa<AppState>();
  const router = new Router<AppState>();

  app.use(cors());

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (error) {
      deps.logger.error({ error }, 'Unhandled application error');
      ctx.status = 500;
      ctx.body = {
        errors: [
          {
            message: 'Internal server error',
            extensions: {
              code: 'INTERNAL_ERROR'
            }
          }
        ]
      };
    }
  });

  const authMiddleware = createAuthMiddleware({
    tenantRepository: deps.tenantRepository,
    logger: deps.logger
  });

  const yoga = createYoga<YogaServerContext, GraphQLContext>({
    graphqlEndpoint: '/graphql',
    landingPage: false,
    maskedErrors: false,
    schema: createGraphQLSchema(),
    context: (initialContext) =>
      buildGraphQLContext(initialContext, {
        logger: deps.logger,
        leakyBucketService: deps.leakyBucketService,
        dictRateLimitService: deps.dictRateLimitService
      })
  });

  router.get('/health', (ctx) => {
    ctx.status = 200;
    ctx.body = {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  });

  router.all('/graphql', authMiddleware, async (ctx) => {
    const response = await yoga.handleNodeRequest(ctx.req, {
      tenant: ctx.state.tenant ?? null,
      requestId: randomUUID()
    });

    response.headers.forEach((value, key) => {
      ctx.set(key, value);
    });

    const bodyText = await response.text();
    const contentType = response.headers.get('content-type') ?? '';
    let status = response.status;

    if (status === 200 && contentType.includes('application/json')) {
      try {
        const payload = JSON.parse(bodyText) as GraphQLResponsePayload;
        const simulationResult = payload.data?.simulateDictOperation;

        if (simulationResult?.allowed === false && simulationResult.httpStatus === 429) {
          status = 429;
        }
      } catch {
        // Ignore parsing errors and keep original status code.
      }
    }

    ctx.status = status;
    ctx.body = bodyText;
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  return app;
}
