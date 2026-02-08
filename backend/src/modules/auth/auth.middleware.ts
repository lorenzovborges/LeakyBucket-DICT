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

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, value] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !value) {
    return null;
  }

  return value.trim();
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
