import { randomUUID } from 'node:crypto';

import { PrismaClient, type ParticipantCategory, type PixKeyStatus, type Tenant } from '@prisma/client';
import dotenv from 'dotenv';
import pino from 'pino';

import { hashToken } from '../../src/modules/auth/token';
import type { AuthTenant } from '../../src/modules/tenant/tenant.repository';

dotenv.config();

export const TEST_LOGGER = pino({ enabled: false });

export const prisma = new PrismaClient();

export async function connectTestDb(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run database integration tests.');
  }

  await prisma.$connect();
}

export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}

export async function resetDatabase(): Promise<void> {
  await prisma.dictOperationPolicyImpact.deleteMany();
  await prisma.dictOperationAttempt.deleteMany();
  await prisma.dictPaymentCredit.deleteMany();
  await prisma.dictEntryLookupTrace.deleteMany();
  await prisma.dictBucket.deleteMany();
  await prisma.pixQueryAttempt.deleteMany();
  await prisma.leakyBucket.deleteMany();
  await prisma.pixKey.deleteMany();
  await prisma.tenant.deleteMany();
}

interface CreateTenantInput {
  name: string;
  participantCategory?: ParticipantCategory;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const suffix = randomUUID();

  return prisma.tenant.create({
    data: {
      name: input.name,
      tokenHash: hashToken(`token-${suffix}`),
      participantCode: `PSP-${suffix}`,
      participantCategory: input.participantCategory ?? 'H'
    }
  });
}

interface CreateLeakyBucketInput {
  tenantId: string;
  availableTokens?: number;
  maxTokens?: number;
  lastRefillAt?: Date;
}

export async function createLeakyBucket(input: CreateLeakyBucketInput): Promise<void> {
  await prisma.leakyBucket.create({
    data: {
      tenantId: input.tenantId,
      availableTokens: input.availableTokens ?? 10,
      maxTokens: input.maxTokens ?? 10,
      lastRefillAt: input.lastRefillAt ?? new Date()
    }
  });
}

interface CreatePixKeyInput {
  key: string;
  ownerName: string;
  bankName: string;
  status?: PixKeyStatus;
}

export async function createPixKeys(keys: CreatePixKeyInput[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await prisma.pixKey.createMany({
    data: keys.map((key) => ({
      key: key.key,
      ownerName: key.ownerName,
      bankName: key.bankName,
      status: key.status ?? 'ACTIVE'
    }))
  });
}

export function toAuthTenant(tenant: Tenant): AuthTenant {
  return {
    id: tenant.id,
    name: tenant.name,
    tokenHash: tenant.tokenHash,
    participantCode: tenant.participantCode,
    participantCategory: tenant.participantCategory
  };
}
