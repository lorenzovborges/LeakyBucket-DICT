import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

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

type DemoTenantKey = 'A' | 'B';

interface DemoTenantConfig {
  name: string;
  category: string;
  capacity: string;
  token: string;
}

interface DemoLoginConfig {
  enabled: boolean;
  tenants: Record<DemoTenantKey, DemoTenantConfig>;
}

export interface AppDependencies {
  logger: Logger;
  tenantRepository: TenantRepository;
  leakyBucketService: LeakyBucketService;
  dictRateLimitService: DictRateLimitService;
  graphqlMaskedErrors: boolean;
  demoLogin: DemoLoginConfig;
}

interface GraphQLResponsePayload {
  data?: {
    simulateDictOperation?: {
      allowed?: boolean;
      httpStatus?: number;
    };
  };
}

interface DemoLoginRequest {
  tenantKey: DemoTenantKey;
}

const MAX_AUTH_REQUEST_BYTES = 4 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseDemoLoginRequest(value: unknown): DemoLoginRequest | null {
  if (!isRecord(value)) {
    return null;
  }

  const tenantKey = value.tenantKey;

  if (tenantKey !== 'A' && tenantKey !== 'B') {
    return null;
  }

  return {
    tenantKey
  };
}

async function parseJsonBody(request: IncomingMessage): Promise<unknown> {
  let body = '';

  for await (const chunk of request) {
    body += chunk.toString();

    if (body.length > MAX_AUTH_REQUEST_BYTES) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
  }

  if (body.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('INVALID_JSON');
  }
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
    maskedErrors: deps.graphqlMaskedErrors,
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

  router.post('/auth/demo-login', async (ctx) => {
    if (!deps.demoLogin.enabled) {
      ctx.status = 404;
      ctx.body = {
        error: 'Not found'
      };
      return;
    }

    let requestPayload: unknown;

    try {
      requestPayload = await parseJsonBody(ctx.req);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'INVALID_JSON';

      ctx.status = message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      ctx.body = {
        error:
          message === 'PAYLOAD_TOO_LARGE'
            ? 'Payload too large'
            : 'Invalid JSON body. Expected {"tenantKey":"A"|"B"}'
      };
      return;
    }

    const parsed = parseDemoLoginRequest(requestPayload);

    if (!parsed) {
      ctx.status = 400;
      ctx.body = {
        error: 'Invalid payload. Expected {"tenantKey":"A"|"B"}'
      };
      return;
    }

    const tenantConfig = deps.demoLogin.tenants[parsed.tenantKey];

    if (!tenantConfig.token) {
      deps.logger.error(
        { tenantKey: parsed.tenantKey },
        'Demo login token is missing for configured tenant'
      );
      ctx.status = 500;
      ctx.body = {
        error: 'Demo login is misconfigured'
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      tenant: {
        name: tenantConfig.name,
        category: tenantConfig.category,
        capacity: tenantConfig.capacity
      },
      bearerToken: tenantConfig.token
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
