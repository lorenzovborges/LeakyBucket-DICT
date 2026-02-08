import type {
  DictPolicyCode,
  FinalUserCategory
} from './dict.types';

export function calculatePolicyCost(policyCode: DictPolicyCode, statusCode: number): number {
  if (
    policyCode === 'ENTRIES_READ_USER_ANTISCAN' ||
    policyCode === 'ENTRIES_READ_USER_ANTISCAN_V2'
  ) {
    if (statusCode === 200) {
      return 1;
    }

    if (statusCode === 404) {
      return 20;
    }

    return 0;
  }

  if (policyCode === 'ENTRIES_READ_PARTICIPANT_ANTISCAN') {
    if (statusCode === 200) {
      return 1;
    }

    if (statusCode === 404) {
      return 3;
    }

    return 0;
  }

  return statusCode === 500 ? 0 : 1;
}

export function calculateUserCreditAmount(category: FinalUserCategory): number {
  return category === 'PF' ? 1 : 2;
}

export function calculateParticipantCreditAmount(): number {
  return 1;
}
