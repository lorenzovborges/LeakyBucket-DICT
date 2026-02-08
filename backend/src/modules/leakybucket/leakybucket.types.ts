export type PixQueryStatus = 'SUCCESS' | 'FAILED' | 'RATE_LIMITED';
export type PixKeyStatus = 'ACTIVE' | 'INACTIVE';

export interface BucketSnapshot {
  tenantId: string;
  availableTokens: number;
  maxTokens: number;
  lastRefillAt: Date;
}

export interface QueryPixKeyInput {
  pixKey: string;
  amountCents: number;
}

export interface PixQueryResult {
  status: PixQueryStatus;
  message: string;
  pixKeyFound: boolean;
  ownerName: string | null;
  bankName: string | null;
  availableTokens: number;
  maxTokens: number;
  consumedToken: boolean;
  requestedAt: Date;
}

export interface BucketStateResult {
  availableTokens: number;
  maxTokens: number;
  lastRefillAt: Date;
}

export interface PixKeyLookup {
  key: string;
  ownerName: string;
  bankName: string;
  status: PixKeyStatus;
}

export interface CreatePixQueryAttemptInput {
  tenantId: string;
  pixKey: string;
  amount: string;
  result: PixQueryStatus;
  failureReason: string | null;
  tokensBefore: number;
  tokensAfter: number;
  createdAt: Date;
}
