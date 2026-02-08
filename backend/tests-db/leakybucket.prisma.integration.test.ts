import { PrismaLeakyBucketRepository } from '../src/modules/leakybucket/leakybucket.repository';
import { LeakyBucketService } from '../src/modules/leakybucket/leakybucket.service';
import { PixService } from '../src/modules/pix/pix.service';
import {
  connectTestDb,
  createLeakyBucket,
  createTenant,
  disconnectTestDb,
  prisma,
  resetDatabase,
  TEST_LOGGER
} from './helpers/prisma-test-db';

describe('Prisma leaky bucket lock integration', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('keeps token state consistent under concurrent failed requests', async () => {
    const tenant = await createTenant({
      name: 'Tenant leaky lock'
    });

    await createLeakyBucket({
      tenantId: tenant.id,
      availableTokens: 10,
      maxTokens: 10
    });

    const repository = new PrismaLeakyBucketRepository(prisma);
    const service = new LeakyBucketService({
      repository,
      pixService: new PixService(),
      logger: TEST_LOGGER
    });

    const responses = await Promise.all(
      Array.from({ length: 15 }).map((_, index) =>
        service.queryPixKey(tenant.id, {
          pixKey: `missing-prisma-${index}`,
          amountCents: 100
        })
      )
    );

    const failedCount = responses.filter((response) => response.status === 'FAILED').length;
    const rateLimitedCount = responses.filter((response) => response.status === 'RATE_LIMITED').length;

    expect(failedCount).toBe(10);
    expect(rateLimitedCount).toBe(5);

    const bucket = await prisma.leakyBucket.findUnique({
      where: {
        tenantId: tenant.id
      },
      select: {
        availableTokens: true
      }
    });

    expect(bucket?.availableTokens).toBe(0);

    const attempts = await prisma.pixQueryAttempt.findMany({
      where: {
        tenantId: tenant.id
      },
      select: {
        tokensAfter: true
      }
    });

    expect(attempts).toHaveLength(15);
    expect(attempts.some((attempt) => attempt.tokensAfter < 0)).toBe(false);
  });
});
