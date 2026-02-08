import type {
  DictKeyType as GeneratedDictKeyType,
  DictOperation as GeneratedDictOperation,
  DictPolicyCode as GeneratedDictPolicyCode,
  DictScopeType as GeneratedDictScopeType,
} from '../__generated__/DictSimulatorTabMutation.graphql';

export type DictOperation = Exclude<GeneratedDictOperation, '%future added value'>;
export type DictKeyType = Exclude<GeneratedDictKeyType, '%future added value'>;
export type DictPolicyCode = Exclude<GeneratedDictPolicyCode, '%future added value'>;
export type DictScopeType = Exclude<GeneratedDictScopeType, '%future added value'>;

export const DICT_OPERATION_GROUPS: Record<string, readonly DictOperation[]> = {
  Entries: [
    'GET_ENTRY',
    'GET_ENTRY_STATISTICS',
    'CREATE_ENTRY',
    'DELETE_ENTRY',
    'UPDATE_ENTRY',
  ],
  Claims: [
    'GET_CLAIM',
    'CREATE_CLAIM',
    'ACKNOWLEDGE_CLAIM',
    'CANCEL_CLAIM',
    'CONFIRM_CLAIM',
    'COMPLETE_CLAIM',
    'LIST_CLAIMS',
  ],
  'Sync / CID': [
    'CREATE_SYNC_VERIFICATION',
    'CREATE_CID_SET_FILE',
    'GET_CID_SET_FILE',
    'LIST_CID_SET_EVENTS',
    'GET_ENTRY_BY_CID',
  ],
  Infractions: [
    'GET_INFRACTION_REPORT',
    'CREATE_INFRACTION_REPORT',
    'ACKNOWLEDGE_INFRACTION_REPORT',
    'CANCEL_INFRACTION_REPORT',
    'CLOSE_INFRACTION_REPORT',
    'UPDATE_INFRACTION_REPORT',
    'LIST_INFRACTION_REPORTS',
  ],
  Keys: ['CHECK_KEYS'],
  Refunds: ['GET_REFUND', 'CREATE_REFUND', 'CANCEL_REFUND', 'CLOSE_REFUND', 'LIST_REFUNDS'],
  Fraud: [
    'GET_FRAUD_MARKER',
    'CREATE_FRAUD_MARKER',
    'CANCEL_FRAUD_MARKER',
    'LIST_FRAUD_MARKERS',
  ],
  Statistics: ['GET_PERSON_STATISTICS'],
  Admin: ['GET_BUCKET_STATE', 'LIST_BUCKET_STATES', 'LIST_EVENT_NOTIFICATIONS'],
};

export const OPERATIONS_NEEDING_PAYER: ReadonlySet<DictOperation> = new Set([
  'GET_ENTRY',
]);

export const OPERATIONS_WITH_ROLE_FILTER: ReadonlySet<DictOperation> = new Set([
  'LIST_CLAIMS',
  'LIST_INFRACTION_REPORTS',
  'LIST_REFUNDS',
]);

export const DICT_KEY_TYPES: readonly DictKeyType[] = [
  'EMAIL',
  'PHONE',
  'CPF',
  'CNPJ',
  'EVP',
];

export const DICT_SCOPE_TYPES: readonly DictScopeType[] = ['USER', 'PSP'];

export const DICT_POLICY_CODES: readonly DictPolicyCode[] = [
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
  'EVENT_LIST',
];
