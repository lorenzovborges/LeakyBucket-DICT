import type { PrismaClient } from '@prisma/client';

import type { ParticipantCategory } from '../dict/dict.types';

export interface AuthTenant {
  id: string;
  name: string;
  tokenHash: string;
  participantCode: string;
  participantCategory: ParticipantCategory;
}

export interface TenantRepository {
  findByTokenHash(tokenHash: string): Promise<AuthTenant | null>;
}

export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByTokenHash(tokenHash: string): Promise<AuthTenant | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        name: true,
        tokenHash: true,
        participantCode: true,
        participantCategory: true
      }
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      name: tenant.name,
      tokenHash: tenant.tokenHash,
      participantCode: tenant.participantCode,
      participantCategory: tenant.participantCategory
    };
  }
}
