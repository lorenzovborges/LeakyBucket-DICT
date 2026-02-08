import { calculatePolicyCost } from '../src/modules/dict/cost-calculator';
import type { DictOperation, DictPolicyCode } from '../src/modules/dict/dict.types';
import { DICT_OPERATIONS, DictValidationError } from '../src/modules/dict/dict.types';
import {
  resolveFinalUserCategory,
  resolvePoliciesForOperation,
  resolveUserAntiScanPolicy,
  validateOperationInput
} from '../src/modules/dict/policy-resolver';

const FIXED_OPERATION_POLICY_CASES: Array<{
  operation: DictOperation;
  expectedPolicies: DictPolicyCode[];
}> = [
  { operation: 'GET_ENTRY_STATISTICS', expectedPolicies: ['ENTRIES_STATISTICS_READ'] },
  { operation: 'CREATE_ENTRY', expectedPolicies: ['ENTRIES_WRITE'] },
  { operation: 'DELETE_ENTRY', expectedPolicies: ['ENTRIES_WRITE'] },
  { operation: 'UPDATE_ENTRY', expectedPolicies: ['ENTRIES_UPDATE'] },
  { operation: 'GET_CLAIM', expectedPolicies: ['CLAIMS_READ'] },
  { operation: 'CREATE_CLAIM', expectedPolicies: ['CLAIMS_WRITE'] },
  { operation: 'ACKNOWLEDGE_CLAIM', expectedPolicies: ['CLAIMS_WRITE'] },
  { operation: 'CANCEL_CLAIM', expectedPolicies: ['CLAIMS_WRITE'] },
  { operation: 'CONFIRM_CLAIM', expectedPolicies: ['CLAIMS_WRITE'] },
  { operation: 'COMPLETE_CLAIM', expectedPolicies: ['CLAIMS_WRITE'] },
  { operation: 'CREATE_SYNC_VERIFICATION', expectedPolicies: ['SYNC_VERIFICATIONS_WRITE'] },
  { operation: 'CREATE_CID_SET_FILE', expectedPolicies: ['CIDS_FILES_WRITE'] },
  { operation: 'GET_CID_SET_FILE', expectedPolicies: ['CIDS_FILES_READ'] },
  { operation: 'LIST_CID_SET_EVENTS', expectedPolicies: ['CIDS_EVENTS_LIST'] },
  { operation: 'GET_ENTRY_BY_CID', expectedPolicies: ['CIDS_ENTRIES_READ'] },
  { operation: 'GET_INFRACTION_REPORT', expectedPolicies: ['INFRACTION_REPORTS_READ'] },
  { operation: 'CREATE_INFRACTION_REPORT', expectedPolicies: ['INFRACTION_REPORTS_WRITE'] },
  { operation: 'ACKNOWLEDGE_INFRACTION_REPORT', expectedPolicies: ['INFRACTION_REPORTS_WRITE'] },
  { operation: 'CANCEL_INFRACTION_REPORT', expectedPolicies: ['INFRACTION_REPORTS_WRITE'] },
  { operation: 'CLOSE_INFRACTION_REPORT', expectedPolicies: ['INFRACTION_REPORTS_WRITE'] },
  { operation: 'UPDATE_INFRACTION_REPORT', expectedPolicies: ['INFRACTION_REPORTS_WRITE'] },
  { operation: 'CHECK_KEYS', expectedPolicies: ['KEYS_CHECK'] },
  { operation: 'GET_REFUND', expectedPolicies: ['REFUNDS_READ'] },
  { operation: 'CREATE_REFUND', expectedPolicies: ['REFUNDS_WRITE'] },
  { operation: 'CANCEL_REFUND', expectedPolicies: ['REFUNDS_WRITE'] },
  { operation: 'CLOSE_REFUND', expectedPolicies: ['REFUNDS_WRITE'] },
  { operation: 'GET_FRAUD_MARKER', expectedPolicies: ['FRAUD_MARKERS_READ'] },
  { operation: 'CREATE_FRAUD_MARKER', expectedPolicies: ['FRAUD_MARKERS_WRITE'] },
  { operation: 'CANCEL_FRAUD_MARKER', expectedPolicies: ['FRAUD_MARKERS_WRITE'] },
  { operation: 'LIST_FRAUD_MARKERS', expectedPolicies: ['FRAUD_MARKERS_LIST'] },
  { operation: 'GET_PERSON_STATISTICS', expectedPolicies: ['PERSONS_STATISTICS_READ'] },
  { operation: 'GET_BUCKET_STATE', expectedPolicies: ['POLICIES_READ'] },
  { operation: 'LIST_BUCKET_STATES', expectedPolicies: ['POLICIES_LIST'] },
  { operation: 'LIST_EVENT_NOTIFICATIONS', expectedPolicies: ['EVENT_LIST'] }
];

describe('DICT policy resolver', () => {
  it('covers all DICT operations in resolver mapping tests', () => {
    const coveredOperations = new Set<DictOperation>([
      'GET_ENTRY',
      'LIST_CLAIMS',
      'LIST_REFUNDS',
      'LIST_INFRACTION_REPORTS',
      ...FIXED_OPERATION_POLICY_CASES.map((item) => item.operation)
    ]);

    expect([...DICT_OPERATIONS].sort()).toEqual([...coveredOperations].sort());
  });

  it('resolves getEntry policies by key type', () => {
    const emailPolicies = resolvePoliciesForOperation({
      operation: 'GET_ENTRY',
      payerId: '12345678901',
      keyType: 'EMAIL',
      endToEndId: 'E2E-1'
    });

    const cpfPolicies = resolvePoliciesForOperation({
      operation: 'GET_ENTRY',
      payerId: '12345678901',
      keyType: 'CPF',
      endToEndId: 'E2E-2'
    });

    expect(emailPolicies).toEqual([
      'ENTRIES_READ_USER_ANTISCAN',
      'ENTRIES_READ_PARTICIPANT_ANTISCAN'
    ]);
    expect(cpfPolicies).toEqual([
      'ENTRIES_READ_USER_ANTISCAN_V2',
      'ENTRIES_READ_PARTICIPANT_ANTISCAN'
    ]);
  });

  it('resolves list policies with role filter', () => {
    expect(
      resolvePoliciesForOperation({
        operation: 'LIST_CLAIMS',
        hasRoleFilter: true
      })
    ).toEqual(['CLAIMS_LIST_WITH_ROLE']);
    expect(
      resolvePoliciesForOperation({
        operation: 'LIST_CLAIMS',
        hasRoleFilter: false
      })
    ).toEqual(['CLAIMS_LIST_WITHOUT_ROLE']);

    expect(
      resolvePoliciesForOperation({
        operation: 'LIST_REFUNDS',
        hasRoleFilter: true
      })
    ).toEqual(['REFUND_LIST_WITH_ROLE']);
    expect(
      resolvePoliciesForOperation({
        operation: 'LIST_REFUNDS',
        hasRoleFilter: false
      })
    ).toEqual(['REFUND_LIST_WITHOUT_ROLE']);

    expect(
      resolvePoliciesForOperation({
        operation: 'LIST_INFRACTION_REPORTS',
        hasRoleFilter: true
      })
    ).toEqual(['INFRACTION_REPORTS_LIST_WITH_ROLE']);
    expect(
      resolvePoliciesForOperation({
        operation: 'LIST_INFRACTION_REPORTS',
        hasRoleFilter: false
      })
    ).toEqual(['INFRACTION_REPORTS_LIST_WITHOUT_ROLE']);
  });

  it.each(FIXED_OPERATION_POLICY_CASES)(
    'resolves fixed operation $operation to $expectedPolicies',
    ({ operation, expectedPolicies }) => {
      expect(
        resolvePoliciesForOperation({
          operation
        })
      ).toEqual(expectedPolicies);
    }
  );

  it('validates required fields per operation', () => {
    expect(() =>
      validateOperationInput({
        operation: 'GET_ENTRY',
        keyType: 'EMAIL',
        endToEndId: 'E2E-1'
      })
    ).toThrow(DictValidationError);

    expect(() =>
      validateOperationInput({
        operation: 'LIST_REFUNDS'
      })
    ).toThrow('hasRoleFilter');
  });

  it('maps payerId and keyType helper functions', () => {
    expect(resolveFinalUserCategory('12345678901')).toBe('PF');
    expect(resolveFinalUserCategory('12345678000199')).toBe('PJ');
    expect(() => resolveFinalUserCategory('123')).toThrow(DictValidationError);
    expect(resolveUserAntiScanPolicy('PHONE')).toBe('ENTRIES_READ_USER_ANTISCAN');
    expect(resolveUserAntiScanPolicy('EVP')).toBe('ENTRIES_READ_USER_ANTISCAN_V2');
  });
});

describe('DICT cost calculator', () => {
  it('applies anti-scan costs based on status', () => {
    expect(calculatePolicyCost('ENTRIES_READ_USER_ANTISCAN', 200)).toBe(1);
    expect(calculatePolicyCost('ENTRIES_READ_USER_ANTISCAN', 404)).toBe(20);
    expect(calculatePolicyCost('ENTRIES_READ_USER_ANTISCAN', 500)).toBe(0);

    expect(calculatePolicyCost('ENTRIES_READ_PARTICIPANT_ANTISCAN', 200)).toBe(1);
    expect(calculatePolicyCost('ENTRIES_READ_PARTICIPANT_ANTISCAN', 404)).toBe(3);
    expect(calculatePolicyCost('ENTRIES_READ_PARTICIPANT_ANTISCAN', 302)).toBe(0);
  });

  it('applies default rule to remaining policies', () => {
    expect(calculatePolicyCost('CLAIMS_WRITE', 200)).toBe(1);
    expect(calculatePolicyCost('CLAIMS_WRITE', 404)).toBe(1);
    expect(calculatePolicyCost('CLAIMS_WRITE', 500)).toBe(0);
  });
});
