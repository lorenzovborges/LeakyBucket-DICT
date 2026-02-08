import {
  DictValidationError,
  type DictKeyType,
  type DictOperation,
  type DictPolicyCode,
  type FinalUserCategory,
  type OperationValidationInput,
  type PolicyResolutionInput
} from './dict.types';

const DIGITS_ONLY_PATTERN = /^\d+$/;

function requireField<T>(value: T | null | undefined, field: string, operation: DictOperation): T {
  if (value === null || value === undefined) {
    throw new DictValidationError(`Field ${field} is required for operation ${operation}`);
  }

  return value;
}

function requiresRoleFilter(operation: DictOperation): boolean {
  return (
    operation === 'LIST_CLAIMS' ||
    operation === 'LIST_REFUNDS' ||
    operation === 'LIST_INFRACTION_REPORTS'
  );
}

export function normalizePayerId(value: string): string {
  return value.replace(/\D/g, '');
}

export function resolveFinalUserCategory(payerId: string): FinalUserCategory {
  const normalized = normalizePayerId(payerId);

  if (!DIGITS_ONLY_PATTERN.test(normalized)) {
    throw new DictValidationError('payerId must contain only digits');
  }

  if (normalized.length === 11) {
    return 'PF';
  }

  if (normalized.length === 14) {
    return 'PJ';
  }

  throw new DictValidationError('payerId must be a valid CPF (11) or CNPJ (14)');
}

export function resolveUserAntiScanPolicy(keyType: DictKeyType): DictPolicyCode {
  if (keyType === 'EMAIL' || keyType === 'PHONE') {
    return 'ENTRIES_READ_USER_ANTISCAN';
  }

  return 'ENTRIES_READ_USER_ANTISCAN_V2';
}

export function validateOperationInput(input: OperationValidationInput): void {
  if (input.operation === 'GET_ENTRY') {
    requireField(input.payerId, 'payerId', input.operation);
    requireField(input.keyType, 'keyType', input.operation);
    requireField(input.endToEndId, 'endToEndId', input.operation);
  }

  if (requiresRoleFilter(input.operation)) {
    requireField(input.hasRoleFilter, 'hasRoleFilter', input.operation);
  }
}

export function resolvePoliciesForOperation(input: PolicyResolutionInput): DictPolicyCode[] {
  validateOperationInput(input);

  switch (input.operation) {
    case 'GET_ENTRY': {
      const keyType = requireField(input.keyType, 'keyType', input.operation);
      return [resolveUserAntiScanPolicy(keyType), 'ENTRIES_READ_PARTICIPANT_ANTISCAN'];
    }
    case 'GET_ENTRY_STATISTICS':
      return ['ENTRIES_STATISTICS_READ'];
    case 'CREATE_ENTRY':
    case 'DELETE_ENTRY':
      return ['ENTRIES_WRITE'];
    case 'UPDATE_ENTRY':
      return ['ENTRIES_UPDATE'];
    case 'GET_CLAIM':
      return ['CLAIMS_READ'];
    case 'CREATE_CLAIM':
    case 'ACKNOWLEDGE_CLAIM':
    case 'CANCEL_CLAIM':
    case 'CONFIRM_CLAIM':
    case 'COMPLETE_CLAIM':
      return ['CLAIMS_WRITE'];
    case 'LIST_CLAIMS': {
      const hasRoleFilter = requireField(input.hasRoleFilter, 'hasRoleFilter', input.operation);
      return [hasRoleFilter ? 'CLAIMS_LIST_WITH_ROLE' : 'CLAIMS_LIST_WITHOUT_ROLE'];
    }
    case 'CREATE_SYNC_VERIFICATION':
      return ['SYNC_VERIFICATIONS_WRITE'];
    case 'CREATE_CID_SET_FILE':
      return ['CIDS_FILES_WRITE'];
    case 'GET_CID_SET_FILE':
      return ['CIDS_FILES_READ'];
    case 'LIST_CID_SET_EVENTS':
      return ['CIDS_EVENTS_LIST'];
    case 'GET_ENTRY_BY_CID':
      return ['CIDS_ENTRIES_READ'];
    case 'GET_INFRACTION_REPORT':
      return ['INFRACTION_REPORTS_READ'];
    case 'CREATE_INFRACTION_REPORT':
    case 'ACKNOWLEDGE_INFRACTION_REPORT':
    case 'CANCEL_INFRACTION_REPORT':
    case 'CLOSE_INFRACTION_REPORT':
    case 'UPDATE_INFRACTION_REPORT':
      return ['INFRACTION_REPORTS_WRITE'];
    case 'LIST_INFRACTION_REPORTS': {
      const hasRoleFilter = requireField(input.hasRoleFilter, 'hasRoleFilter', input.operation);
      return [
        hasRoleFilter
          ? 'INFRACTION_REPORTS_LIST_WITH_ROLE'
          : 'INFRACTION_REPORTS_LIST_WITHOUT_ROLE'
      ];
    }
    case 'CHECK_KEYS':
      return ['KEYS_CHECK'];
    case 'GET_REFUND':
      return ['REFUNDS_READ'];
    case 'CREATE_REFUND':
    case 'CANCEL_REFUND':
    case 'CLOSE_REFUND':
      return ['REFUNDS_WRITE'];
    case 'LIST_REFUNDS': {
      const hasRoleFilter = requireField(input.hasRoleFilter, 'hasRoleFilter', input.operation);
      return [hasRoleFilter ? 'REFUND_LIST_WITH_ROLE' : 'REFUND_LIST_WITHOUT_ROLE'];
    }
    case 'GET_FRAUD_MARKER':
      return ['FRAUD_MARKERS_READ'];
    case 'CREATE_FRAUD_MARKER':
    case 'CANCEL_FRAUD_MARKER':
      return ['FRAUD_MARKERS_WRITE'];
    case 'LIST_FRAUD_MARKERS':
      return ['FRAUD_MARKERS_LIST'];
    case 'GET_PERSON_STATISTICS':
      return ['PERSONS_STATISTICS_READ'];
    case 'GET_BUCKET_STATE':
      return ['POLICIES_READ'];
    case 'LIST_BUCKET_STATES':
      return ['POLICIES_LIST'];
    case 'LIST_EVENT_NOTIFICATIONS':
      return ['EVENT_LIST'];
    default: {
      const exhausted: never = input.operation;
      throw new DictValidationError(`Unsupported operation: ${exhausted}`);
    }
  }
}
