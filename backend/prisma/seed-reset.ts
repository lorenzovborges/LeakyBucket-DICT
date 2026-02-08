import 'dotenv/config';

import { createPrismaClient } from '../src/prisma/client';
import { resolveSeedTokens, runSeed } from './seed';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run prisma seed reset.');
}

const prisma = createPrismaClient(databaseUrl);

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

  await runSeed(prisma, resolveSeedTokens());

  console.log('Seed reset finished successfully');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
