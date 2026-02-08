import { randomUUID } from 'node:crypto';

import { InMemoryTenantRepository } from './modules/tenant/in-memory-tenant.repository';
import { InMemoryLeakyBucketRepository } from './modules/leakybucket/in-memory-leakybucket.repository';
import { InMemoryDictRepository } from './modules/dict/in-memory-dict.repository';

export function createSeedRepositories(config: {
  tenantAToken: string;
  tenantBToken: string;
}) {
  const tenantAId = randomUUID();
  const tenantBId = randomUUID();

  const tenantRepository = new InMemoryTenantRepository([
    {
      id: tenantAId,
      name: 'Tenant A',
      token: config.tenantAToken,
      participantCode: 'PSP-A',
      participantCategory: 'A'
    },
    {
      id: tenantBId,
      name: 'Tenant B',
      token: config.tenantBToken,
      participantCode: 'PSP-H',
      participantCategory: 'H'
    }
  ]);

  const leakyBucketRepository = new InMemoryLeakyBucketRepository({
    buckets: [
      {
        tenantId: tenantAId,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: new Date()
      },
      {
        tenantId: tenantBId,
        availableTokens: 10,
        maxTokens: 10,
        lastRefillAt: new Date()
      }
    ],
    pixKeys: [
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

  const dictRepository = new InMemoryDictRepository();

  return { tenantRepository, leakyBucketRepository, dictRepository };
}
