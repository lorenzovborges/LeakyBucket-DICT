import type { AuthTenant, TenantRepository } from './tenant.repository';
import { hashToken } from '../auth/token';

export interface TenantSeed {
  id: string;
  name: string;
  token: string;
  participantCode: string;
  participantCategory: AuthTenant['participantCategory'];
}

export class InMemoryTenantRepository implements TenantRepository {
  private readonly tenantsByTokenHash = new Map<string, AuthTenant>();

  constructor(seed: TenantSeed[]) {
    for (const item of seed) {
      const tokenHash = hashToken(item.token);
      this.tenantsByTokenHash.set(tokenHash, {
        id: item.id,
        name: item.name,
        tokenHash,
        participantCode: item.participantCode,
        participantCategory: item.participantCategory
      });
    }
  }

  async findByTokenHash(tokenHash: string): Promise<AuthTenant | null> {
    return this.tenantsByTokenHash.get(tokenHash) ?? null;
  }
}
