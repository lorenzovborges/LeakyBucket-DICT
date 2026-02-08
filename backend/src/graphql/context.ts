import type { YogaInitialContext } from 'graphql-yoga';
import type { Logger } from 'pino';

import type { DictRateLimitService } from '../modules/dict/dict-rate-limit.service';
import type { LeakyBucketService } from '../modules/leakybucket/leakybucket.service';
import type { AuthTenant } from '../modules/tenant/tenant.repository';

export interface YogaServerContext {
  tenant: AuthTenant | null;
  requestId: string;
}

export interface GraphQLContext {
  tenant: AuthTenant | null;
  requestId: string;
  logger: Logger;
  leakyBucketService: LeakyBucketService;
  dictRateLimitService: DictRateLimitService;
}

interface GraphQLContextDeps {
  logger: Logger;
  leakyBucketService: LeakyBucketService;
  dictRateLimitService: DictRateLimitService;
}

export function buildGraphQLContext(
  initialContext: YogaInitialContext & YogaServerContext,
  deps: GraphQLContextDeps
): GraphQLContext {
  return {
    tenant: initialContext.tenant,
    requestId: initialContext.requestId,
    logger: deps.logger,
    leakyBucketService: deps.leakyBucketService,
    dictRateLimitService: deps.dictRateLimitService
  };
}
