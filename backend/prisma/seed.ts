import 'dotenv/config';

import type { PrismaClient } from '@prisma/client';

import { hashToken } from '../src/modules/auth/token';
import { createPrismaClient } from '../src/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run prisma seed.');
}

const prisma = createPrismaClient(databaseUrl);

export interface SeedTokens {
  tenantA: string;
  tenantB: string;
}

interface TenantSeed {
  name: string;
  participantCode: string;
  participantCategory: 'A' | 'H';
  token: string;
}

interface PixKeySeed {
  key: string;
  ownerName: string;
  bankName: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const PIX_KEY_SEEDS: PixKeySeed[] = [
  {
    key: 'valid-pix-key-001',
    ownerName: 'Joao Silva',
    bankName: 'Leaky Bank',
    status: 'ACTIVE'
  },
  {
    key: 'valid-pix-key-002',
    ownerName: 'Maria Souza',
    bankName: 'Banco Central Mock',
    status: 'ACTIVE'
  },
  {
    key: 'inactive-pix-key-003',
    ownerName: 'Conta Inativa',
    bankName: 'Legacy Bank',
    status: 'INACTIVE'
  }
];

export function resolveSeedTokens(): SeedTokens {
  return {
    tenantA: process.env.DEMO_TENANT_A_TOKEN ?? 'tenant-a-secret',
    tenantB: process.env.DEMO_TENANT_B_TOKEN ?? 'tenant-b-secret'
  };
}

function buildTenantSeeds(tokens: SeedTokens): TenantSeed[] {
  return [
    {
      name: 'Tenant A',
      participantCode: 'PSP-A',
      participantCategory: 'A',
      token: tokens.tenantA
    },
    {
      name: 'Tenant B',
      participantCode: 'PSP-H',
      participantCategory: 'H',
      token: tokens.tenantB
    }
  ];
}

export async function runSeed(client: PrismaClient, tokens: SeedTokens): Promise<void> {
  const tenants = buildTenantSeeds(tokens);

  for (const tenant of tenants) {
    const createdTenant = await client.tenant.upsert({
      where: {
        participantCode: tenant.participantCode
      },
      update: {
        name: tenant.name,
        participantCategory: tenant.participantCategory,
        tokenHash: hashToken(tenant.token)
      },
      create: {
        name: tenant.name,
        participantCode: tenant.participantCode,
        participantCategory: tenant.participantCategory,
        tokenHash: hashToken(tenant.token)
      }
    });

    await client.leakyBucket.upsert({
      where: {
        tenantId: createdTenant.id
      },
      update: {},
      create: {
        tenantId: createdTenant.id,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: new Date()
      }
    });
  }

  for (const pixKey of PIX_KEY_SEEDS) {
    await client.pixKey.upsert({
      where: {
        key: pixKey.key
      },
      update: {
        ownerName: pixKey.ownerName,
        bankName: pixKey.bankName,
        status: pixKey.status
      },
      create: {
        key: pixKey.key,
        ownerName: pixKey.ownerName,
        bankName: pixKey.bankName,
        status: pixKey.status
      }
    });
  }
}

async function main() {
  const tokens = resolveSeedTokens();

  await runSeed(prisma, tokens);

  console.log('Seed finished successfully');
  console.log('Tenant A token:', tokens.tenantA);
  console.log('Tenant B token:', tokens.tenantB);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
