import {
  PixKeyStatus as PrismaPixKeyStatus,
  PixQueryAttemptResult,
  Prisma
} from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

import type {
  BucketSnapshot,
  CreatePixQueryAttemptInput,
  PixKeyLookup,
  PixQueryStatus
} from './leakybucket.types';

const RESULT_MAP: Record<PixQueryStatus, PixQueryAttemptResult> = {
  SUCCESS: PixQueryAttemptResult.SUCCESS,
  FAILED: PixQueryAttemptResult.FAILED,
  RATE_LIMITED: PixQueryAttemptResult.RATE_LIMITED
};

function mapPixStatus(status: PrismaPixKeyStatus): PixKeyLookup['status'] {
  return status === PrismaPixKeyStatus.ACTIVE ? 'ACTIVE' : 'INACTIVE';
}

export interface LeakyBucketTransaction {
  getBucket(): Promise<BucketSnapshot>;
  saveBucket(update: Pick<BucketSnapshot, 'availableTokens' | 'lastRefillAt'>): Promise<BucketSnapshot>;
  findPixKeyByKey(key: string): Promise<PixKeyLookup | null>;
  createAttempt(input: CreatePixQueryAttemptInput): Promise<void>;
}

export interface LeakyBucketRepository {
  withTenantLock<T>(tenantId: string, handler: (tx: LeakyBucketTransaction) => Promise<T>): Promise<T>;
}

export class PrismaLeakyBucketRepository implements LeakyBucketRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async withTenantLock<T>(tenantId: string, handler: (tx: LeakyBucketTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (transaction) => {
      const rows = await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "LeakyBucket"
        WHERE "tenantId" = ${tenantId}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error(`Leaky bucket not found for tenant ${tenantId}`);
      }

      const tx = this.createTransactionAdapter(tenantId, transaction);
      return handler(tx);
    });
  }

  private createTransactionAdapter(
    tenantId: string,
    transaction: Prisma.TransactionClient
  ): LeakyBucketTransaction {
    return {
      getBucket: async () => {
        const bucket = await transaction.leakyBucket.findUnique({
          where: { tenantId },
          select: {
            tenantId: true,
            availableTokens: true,
            maxTokens: true,
            lastRefillAt: true
          }
        });

        if (!bucket) {
          throw new Error(`Leaky bucket not found for tenant ${tenantId}`);
        }

        return {
          tenantId: bucket.tenantId,
          availableTokens: bucket.availableTokens,
          maxTokens: bucket.maxTokens,
          lastRefillAt: bucket.lastRefillAt
        };
      },
      saveBucket: async (update) => {
        const bucket = await transaction.leakyBucket.update({
          where: { tenantId },
          data: {
            availableTokens: update.availableTokens,
            lastRefillAt: update.lastRefillAt
          },
          select: {
            tenantId: true,
            availableTokens: true,
            maxTokens: true,
            lastRefillAt: true
          }
        });

        return {
          tenantId: bucket.tenantId,
          availableTokens: bucket.availableTokens,
          maxTokens: bucket.maxTokens,
          lastRefillAt: bucket.lastRefillAt
        };
      },
      findPixKeyByKey: async (key) => {
        const pixKey = await transaction.pixKey.findUnique({
          where: { key },
          select: {
            key: true,
            ownerName: true,
            bankName: true,
            status: true
          }
        });

        if (!pixKey) {
          return null;
        }

        return {
          key: pixKey.key,
          ownerName: pixKey.ownerName,
          bankName: pixKey.bankName,
          status: mapPixStatus(pixKey.status)
        };
      },
      createAttempt: async (input) => {
        await transaction.pixQueryAttempt.create({
          data: {
            tenantId: input.tenantId,
            pixKey: input.pixKey,
            amount: new Prisma.Decimal(input.amount),
            result: RESULT_MAP[input.result],
            failureReason: input.failureReason,
            tokensBefore: input.tokensBefore,
            tokensAfter: input.tokensAfter,
            createdAt: input.createdAt
          }
        });
      }
    };
  }
}
