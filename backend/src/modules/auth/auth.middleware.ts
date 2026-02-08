import type { Middleware } from 'koa';
import type { Logger } from 'pino';

import type { AppState } from '../../types/app';
import { hashToken } from './token';
import type { TenantRepository } from '../tenant/tenant.repository';

interface AuthMiddlewareDeps {
  tenantRepository: TenantRepository;
  logger: Logger;
}

interface ErrorPayload {
  errors: Array<{
    message: string;
    extensions: {
      code: 'UNAUTHENTICATED';
    };
  }>;
}

const UNAUTHENTICATED_PAYLOAD: ErrorPayload = {
  errors: [
    {
      message: 'Authentication failed',
      extensions: {
        code: 'UNAUTHENTICATED'
      }
    }
  ]
};

const BEARER_TOKEN_PATTERN = /^Bearer\s+(\S+)$/i;

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const match = BEARER_TOKEN_PATTERN.exec(authorizationHeader.trim());

  if (!match) {
    return null;
  }

  return match[1];
}

export function createAuthMiddleware({ tenantRepository, logger }: AuthMiddlewareDeps): Middleware<AppState> {
  return async (ctx, next) => {
    const token = extractBearerToken(ctx.get('authorization'));

    if (!token) {
      ctx.status = 401;
      ctx.body = UNAUTHENTICATED_PAYLOAD;
      return;
    }

    const tokenHash = hashToken(token);
    const tenant = await tenantRepository.findByTokenHash(tokenHash);

    if (!tenant) {
      logger.warn({ path: ctx.path }, 'Unauthorized request with invalid bearer token');
      ctx.status = 401;
      ctx.body = UNAUTHENTICATED_PAYLOAD;
      return;
    }

    ctx.state.tenant = tenant;

    await next();
  };
}
