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
