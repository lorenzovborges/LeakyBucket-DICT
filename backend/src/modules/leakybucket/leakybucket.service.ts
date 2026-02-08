import type { Logger } from 'pino';

import type { PixService } from '../pix/pix.service';
import type { LeakyBucketRepository } from './leakybucket.repository';
import type {
  BucketSnapshot,
  BucketStateResult,
  PixQueryResult,
  QueryPixKeyInput
} from './leakybucket.types';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

interface LeakyBucketServiceDeps {
  repository: LeakyBucketRepository;
  pixService: PixService;
  logger: Logger;
  clock?: () => Date;
}

function hasRefillChanged(current: BucketSnapshot, next: BucketSnapshot): boolean {
  return (
    current.availableTokens !== next.availableTokens ||
    current.lastRefillAt.getTime() !== next.lastRefillAt.getTime()
  );
}

function normalizeAmount(amount: number): string {
  return amount.toFixed(2);
}

export function applyHourlyRefill(bucket: BucketSnapshot, now: Date): BucketSnapshot {
  const elapsedMs = now.getTime() - bucket.lastRefillAt.getTime();

  if (elapsedMs < ONE_HOUR_IN_MS) {
    return bucket;
  }

  const elapsedHours = Math.floor(elapsedMs / ONE_HOUR_IN_MS);
  const maxRefill = Math.max(0, bucket.maxTokens - bucket.availableTokens);
  const refill = Math.min(maxRefill, elapsedHours);

  return {
    ...bucket,
    availableTokens: bucket.availableTokens + refill,
    lastRefillAt: new Date(bucket.lastRefillAt.getTime() + elapsedHours * ONE_HOUR_IN_MS)
  };
}

export class LeakyBucketService {
  private readonly now: () => Date;

  constructor(private readonly deps: LeakyBucketServiceDeps) {
    this.now = deps.clock ?? (() => new Date());
  }

  async getBucketState(tenantId: string): Promise<BucketStateResult> {
    return this.deps.repository.withTenantLock(tenantId, async (transaction) => {
      let bucket = await transaction.getBucket();
      const refilledBucket = applyHourlyRefill(bucket, this.now());

      if (hasRefillChanged(bucket, refilledBucket)) {
        bucket = await transaction.saveBucket({
          availableTokens: refilledBucket.availableTokens,
          lastRefillAt: refilledBucket.lastRefillAt
        });
      }

      return {
        availableTokens: bucket.availableTokens,
        maxTokens: bucket.maxTokens,
        lastRefillAt: bucket.lastRefillAt
      };
    });
  }

  async queryPixKey(tenantId: string, input: QueryPixKeyInput): Promise<PixQueryResult> {
    const requestedAt = this.now();

    return this.deps.repository.withTenantLock(tenantId, async (transaction) => {
      let bucket = await transaction.getBucket();
      const refilledBucket = applyHourlyRefill(bucket, requestedAt);

      if (hasRefillChanged(bucket, refilledBucket)) {
        bucket = await transaction.saveBucket({
          availableTokens: refilledBucket.availableTokens,
          lastRefillAt: refilledBucket.lastRefillAt
        });
      }

      const tokensBefore = bucket.availableTokens;

      if (tokensBefore <= 0) {
        const rateLimitedResult: PixQueryResult = {
          status: 'RATE_LIMITED',
          message: 'No query tokens available. Try again later.',
          pixKeyFound: false,
          ownerName: null,
          bankName: null,
          availableTokens: bucket.availableTokens,
          maxTokens: bucket.maxTokens,
          consumedToken: false,
          requestedAt
        };

        await transaction.createAttempt({
          tenantId,
          pixKey: input.pixKey,
          amount: normalizeAmount(input.amount),
          result: 'RATE_LIMITED',
          failureReason: 'NO_AVAILABLE_TOKENS',
          tokensBefore,
          tokensAfter: tokensBefore,
          createdAt: requestedAt
        });

        this.deps.logger.info(
          {
            tenantId,
            status: rateLimitedResult.status,
            tokensBefore,
            tokensAfter: tokensBefore
          },
          'Pix query rate limited'
        );

        return rateLimitedResult;
      }

      const pixLookup = await this.deps.pixService.queryPixKey(transaction, input.pixKey);

      if (pixLookup.success) {
        await transaction.createAttempt({
          tenantId,
          pixKey: input.pixKey,
          amount: normalizeAmount(input.amount),
          result: 'SUCCESS',
          failureReason: null,
          tokensBefore,
          tokensAfter: tokensBefore,
          createdAt: requestedAt
        });

        this.deps.logger.info(
          {
            tenantId,
            status: 'SUCCESS',
            tokensBefore,
            tokensAfter: tokensBefore
          },
          'Pix query processed successfully'
        );

        return {
          status: 'SUCCESS',
          message: pixLookup.message,
          pixKeyFound: pixLookup.pixKeyFound,
          ownerName: pixLookup.ownerName,
          bankName: pixLookup.bankName,
          availableTokens: tokensBefore,
          maxTokens: bucket.maxTokens,
          consumedToken: false,
          requestedAt
        };
      }

      const failedTokensAfter = Math.max(0, tokensBefore - 1);

      bucket = await transaction.saveBucket({
        availableTokens: failedTokensAfter,
        lastRefillAt: bucket.lastRefillAt
      });

      await transaction.createAttempt({
        tenantId,
        pixKey: input.pixKey,
        amount: normalizeAmount(input.amount),
        result: 'FAILED',
        failureReason: pixLookup.failureReason,
        tokensBefore,
        tokensAfter: bucket.availableTokens,
        createdAt: requestedAt
      });

      this.deps.logger.info(
        {
          tenantId,
          status: 'FAILED',
          failureReason: pixLookup.failureReason,
          tokensBefore,
          tokensAfter: bucket.availableTokens
        },
        'Pix query failed and consumed one token'
      );

      return {
        status: 'FAILED',
        message: pixLookup.message,
        pixKeyFound: pixLookup.pixKeyFound,
        ownerName: pixLookup.ownerName,
        bankName: pixLookup.bankName,
        availableTokens: bucket.availableTokens,
        maxTokens: bucket.maxTokens,
        consumedToken: true,
        requestedAt
      };
    });
  }
}
