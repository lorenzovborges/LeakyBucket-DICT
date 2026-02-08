import { PrismaClient } from '@prisma/client';

import { hashToken } from '../src/modules/auth/token';

const prisma = new PrismaClient();

const tenantTokens = {
  tenantA: 'tenant-a-secret',
  tenantB: 'tenant-b-secret'
};

async function main() {
  await prisma.dictOperationPolicyImpact.deleteMany();
  await prisma.dictOperationAttempt.deleteMany();
  await prisma.dictPaymentCredit.deleteMany();
  await prisma.dictEntryLookupTrace.deleteMany();
  await prisma.dictBucket.deleteMany();
  await prisma.pixQueryAttempt.deleteMany();
  await prisma.leakyBucket.deleteMany();
  await prisma.pixKey.deleteMany();
  await prisma.tenant.deleteMany();

  const tenantA = await prisma.tenant.create({
    data: {
      name: 'Tenant A',
      tokenHash: hashToken(tenantTokens.tenantA),
      participantCode: 'PSP-A',
      participantCategory: 'A'
    }
  });

  const tenantB = await prisma.tenant.create({
    data: {
      name: 'Tenant B',
      tokenHash: hashToken(tenantTokens.tenantB),
      participantCode: 'PSP-H',
      participantCategory: 'H'
    }
  });

  await prisma.leakyBucket.createMany({
    data: [
      {
        tenantId: tenantA.id,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: new Date()
      },
      {
        tenantId: tenantB.id,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: new Date()
      }
    ]
  });

  await prisma.pixKey.createMany({
    data: [
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
    ]
  });

  console.log('Seed finished successfully');
  console.log('Tenant A token:', tenantTokens.tenantA);
  console.log('Tenant B token:', tenantTokens.tenantB);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
