export const DICT_OPERATIONS = [
  'GET_ENTRY',
  'GET_ENTRY_STATISTICS',
  'CREATE_ENTRY',
  'DELETE_ENTRY',
  'UPDATE_ENTRY',
  'GET_CLAIM',
  'CREATE_CLAIM',
  'ACKNOWLEDGE_CLAIM',
  'CANCEL_CLAIM',
  'CONFIRM_CLAIM',
  'COMPLETE_CLAIM',
  'LIST_CLAIMS',
  'CREATE_SYNC_VERIFICATION',
  'CREATE_CID_SET_FILE',
  'GET_CID_SET_FILE',
  'LIST_CID_SET_EVENTS',
  'GET_ENTRY_BY_CID',
  'GET_INFRACTION_REPORT',
  'CREATE_INFRACTION_REPORT',
  'ACKNOWLEDGE_INFRACTION_REPORT',
  'CANCEL_INFRACTION_REPORT',
  'CLOSE_INFRACTION_REPORT',
  'UPDATE_INFRACTION_REPORT',
  'LIST_INFRACTION_REPORTS',
  'CHECK_KEYS',
  'GET_REFUND',
  'CREATE_REFUND',
  'CANCEL_REFUND',
  'CLOSE_REFUND',
  'LIST_REFUNDS',
  'GET_FRAUD_MARKER',
  'CREATE_FRAUD_MARKER',
  'CANCEL_FRAUD_MARKER',
  'LIST_FRAUD_MARKERS',
  'GET_PERSON_STATISTICS',
  'GET_BUCKET_STATE',
  'LIST_BUCKET_STATES',
  'LIST_EVENT_NOTIFICATIONS'
] as const;

export type DictOperation = (typeof DICT_OPERATIONS)[number];

export const DICT_KEY_TYPES = ['EMAIL', 'PHONE', 'CPF', 'CNPJ', 'EVP'] as const;
export type DictKeyType = (typeof DICT_KEY_TYPES)[number];

export const DICT_SCOPE_TYPES = ['USER', 'PSP'] as const;
export type DictScopeType = (typeof DICT_SCOPE_TYPES)[number];

export const FINAL_USER_CATEGORIES = ['PF', 'PJ'] as const;
export type FinalUserCategory = (typeof FINAL_USER_CATEGORIES)[number];

export const PARTICIPANT_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
export type ParticipantCategory = (typeof PARTICIPANT_CATEGORIES)[number];

export const DICT_POLICY_CODES = [
  'ENTRIES_READ_USER_ANTISCAN',
  'ENTRIES_READ_USER_ANTISCAN_V2',
  'ENTRIES_READ_PARTICIPANT_ANTISCAN',
  'ENTRIES_STATISTICS_READ',
  'ENTRIES_WRITE',
  'ENTRIES_UPDATE',
  'CLAIMS_READ',
  'CLAIMS_WRITE',
  'CLAIMS_LIST_WITH_ROLE',
  'CLAIMS_LIST_WITHOUT_ROLE',
  'SYNC_VERIFICATIONS_WRITE',
  'CIDS_FILES_WRITE',
  'CIDS_FILES_READ',
  'CIDS_EVENTS_LIST',
  'CIDS_ENTRIES_READ',
  'INFRACTION_REPORTS_READ',
  'INFRACTION_REPORTS_WRITE',
  'INFRACTION_REPORTS_LIST_WITH_ROLE',
  'INFRACTION_REPORTS_LIST_WITHOUT_ROLE',
  'KEYS_CHECK',
  'REFUNDS_READ',
  'REFUNDS_WRITE',
  'REFUND_LIST_WITH_ROLE',
  'REFUND_LIST_WITHOUT_ROLE',
  'FRAUD_MARKERS_READ',
  'FRAUD_MARKERS_WRITE',
  'FRAUD_MARKERS_LIST',
  'PERSONS_STATISTICS_READ',
  'POLICIES_READ',
  'POLICIES_LIST',
  'EVENT_LIST'
] as const;

export type DictPolicyCode = (typeof DICT_POLICY_CODES)[number];

export interface DictBucketIdentity {
  policyCode: DictPolicyCode;
  scopeType: DictScopeType;
  scopeKey: string;
}

export interface DictBucketSnapshot extends DictBucketIdentity {
  tokens: number;
  lastRefillAt: Date;
}

export interface PolicyRateConfig {
  capacity: number;
  refillPerSecond: number;
}

export interface PolicyCharge extends DictBucketIdentity {
  capacity: number;
  refillPerSecond: number;
  costApplied: number;
}

export interface DictPolicyImpact extends DictBucketIdentity {
  costApplied: number;
  tokensBefore: number;
  tokensAfter: number;
  capacity: number;
  refillPerSecond: number;
}

export interface SimulateDictOperationInput {
  operation: DictOperation;
  simulatedStatusCode: number;
  payerId?: string | null;
  keyType?: DictKeyType | null;
  endToEndId?: string | null;
  hasRoleFilter?: boolean | null;
}

export interface SimulateDictOperationResult {
  allowed: boolean;
  httpStatus: number;
  blockedByPolicies: DictPolicyCode[];
  impacts: DictPolicyImpact[];
}

export interface RegisterPaymentSentInput {
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
}

export type RegisterPaymentSentReason =
  | 'CREDIT_APPLIED'
  | 'PAYMENT_ALREADY_REGISTERED'
  | 'ENTRY_LOOKUP_NOT_ELIGIBLE';

export interface RegisterPaymentSentResult {
  credited: boolean;
  reason: RegisterPaymentSentReason;
  impacts: DictPolicyImpact[];
}

export interface DictBucketStateInput {
  policyCode: DictPolicyCode;
  scopeType: DictScopeType;
  scopeKey: string;
}

export interface DictBucketState extends DictBucketIdentity {
  tokens: number;
  capacity: number;
  refillPerSecond: number;
  lastRefillAt: Date;
}

export interface DictBucketListFilter {
  policyCode?: DictPolicyCode | null;
  scopeType?: DictScopeType | null;
}

export interface OperationValidationInput {
  operation: DictOperation;
  payerId?: string | null;
  keyType?: DictKeyType | null;
  endToEndId?: string | null;
  hasRoleFilter?: boolean | null;
}

export interface PolicyResolutionInput extends OperationValidationInput {
  operation: DictOperation;
}

export interface DictOperationAttemptCreateInput {
  tenantId: string;
  operation: DictOperation;
  simulatedStatusCode: number;
  allowed: boolean;
  httpStatus: number;
  requestPayload: unknown;
}

export interface DictEntryLookupTraceCreateInput {
  tenantId: string;
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
  simulatedStatusCode: number;
  eligibleForCredit: boolean;
}

export interface DictEntryLookupTraceSearchInput {
  tenantId: string;
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
}

export interface DictPaymentCreditCreateInput {
  tenantId: string;
  payerId: string;
  keyType: DictKeyType;
  endToEndId: string;
  impactPayload: unknown;
}

export class DictValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DictValidationError';
  }
}
