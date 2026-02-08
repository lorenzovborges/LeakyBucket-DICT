import { DictRateLimitService } from '../src/modules/dict/dict-rate-limit.service';
import { PrismaDictRepository } from '../src/modules/dict/dict.repository';
import {
  connectTestDb,
  createTenant,
  disconnectTestDb,
  prisma,
  resetDatabase,
  TEST_LOGGER,
  toAuthTenant
} from './helpers/prisma-test-db';

const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z');

describe('Prisma DICT lock integration', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('keeps state consistent for concurrent GET_ENTRY 404 requests in the same scope', async () => {
    const tenant = await createTenant({
      name: 'Tenant dict lock',
      participantCategory: 'H'
    });

    const authTenant = toAuthTenant(tenant);
    const repository = new PrismaDictRepository(prisma);
    const service = new DictRateLimitService({
      repository,
      logger: TEST_LOGGER,
      clock: () => FIXED_NOW
    });

    const responses = await Promise.all(
      Array.from({ length: 20 }).map((_, index) =>
        service.simulateOperation(authTenant, {
          operation: 'GET_ENTRY',
          simulatedStatusCode: 404,
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: `E2E-PRISMA-${index}`
        })
      )
    );

    const allowedCount = responses.filter((response) => response.allowed).length;
    const blockedCount = responses.filter((response) => !response.allowed).length;

    expect(allowedCount).toBe(5);
    expect(blockedCount).toBe(15);
    expect(
      responses
        .filter((response) => !response.allowed)
        .every((response) => response.httpStatus === 429)
    ).toBe(true);

    const userBucket = await prisma.dictBucket.findUnique({
      where: {
        policyCode_scopeType_scopeKey: {
          policyCode: 'ENTRIES_READ_USER_ANTISCAN',
          scopeType: 'USER',
          scopeKey: `${tenant.id}:12345678901`
        }
      },
      select: {
        tokens: true
      }
    });

    const pspBucket = await prisma.dictBucket.findUnique({
      where: {
        policyCode_scopeType_scopeKey: {
          policyCode: 'ENTRIES_READ_PARTICIPANT_ANTISCAN',
          scopeType: 'PSP',
          scopeKey: tenant.id
        }
      },
      select: {
        tokens: true
      }
    });

    expect(userBucket?.tokens.toNumber()).toBe(0);
    expect(pspBucket?.tokens.toNumber()).toBeGreaterThanOrEqual(0);
  });

  it('applies exactly one payment credit under concurrent registerPaymentSent calls', async () => {
    const tenant = await createTenant({
      name: 'Tenant dict credit',
      participantCategory: 'H'
    });

    const authTenant = toAuthTenant(tenant);
    const repository = new PrismaDictRepository(prisma);
    const service = new DictRateLimitService({
      repository,
      logger: TEST_LOGGER,
      clock: () => FIXED_NOW
    });

    await service.simulateOperation(authTenant, {
      operation: 'GET_ENTRY',
      simulatedStatusCode: 200,
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-CREDIT-PRISMA'
    });

    const results = await Promise.all(
      Array.from({ length: 10 }).map(() =>
        service.registerPaymentSent(authTenant, {
          payerId: '12345678901',
          keyType: 'EMAIL',
          endToEndId: 'E2E-CREDIT-PRISMA'
        })
      )
    );

    const creditedCount = results.filter((result) => result.credited).length;
    const alreadyRegisteredCount = results.filter(
      (result) => result.reason === 'PAYMENT_ALREADY_REGISTERED'
    ).length;

    expect(creditedCount).toBe(1);
    expect(alreadyRegisteredCount).toBe(9);

    const credits = await prisma.dictPaymentCredit.findMany({
      where: {
        tenantId: tenant.id,
        payerId: '12345678901',
        keyType: 'EMAIL',
        endToEndId: 'E2E-CREDIT-PRISMA'
      },
      select: {
        id: true
      }
    });

    expect(credits).toHaveLength(1);
  });
});
