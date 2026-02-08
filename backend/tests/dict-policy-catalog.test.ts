import {
  DICT_POLICY_CODES,
  FINAL_USER_CATEGORIES,
  PARTICIPANT_CATEGORIES
} from '../src/modules/dict/dict.types';
import type { DictPolicyCode } from '../src/modules/dict/dict.types';
import { getPolicyDefinition, resolvePolicyRateConfig } from '../src/modules/dict/policy-catalog';

const PER_MINUTE = 1 / 60;
const PER_DAY = 1 / (24 * 60 * 60);

const FIXED_POLICY_EXPECTATIONS: Record<string, { capacity: number; refillPerSecond: number }> = {
  ENTRIES_WRITE: { capacity: 36000, refillPerSecond: 1200 * PER_MINUTE },
  ENTRIES_UPDATE: { capacity: 600, refillPerSecond: 600 * PER_MINUTE },
  CLAIMS_READ: { capacity: 18000, refillPerSecond: 600 * PER_MINUTE },
  CLAIMS_WRITE: { capacity: 36000, refillPerSecond: 1200 * PER_MINUTE },
  CLAIMS_LIST_WITH_ROLE: { capacity: 200, refillPerSecond: 40 * PER_MINUTE },
  CLAIMS_LIST_WITHOUT_ROLE: { capacity: 50, refillPerSecond: 10 * PER_MINUTE },
  SYNC_VERIFICATIONS_WRITE: { capacity: 50, refillPerSecond: 10 * PER_MINUTE },
  CIDS_FILES_WRITE: { capacity: 200, refillPerSecond: 40 * PER_DAY },
  CIDS_FILES_READ: { capacity: 50, refillPerSecond: 10 * PER_MINUTE },
  CIDS_EVENTS_LIST: { capacity: 100, refillPerSecond: 20 * PER_MINUTE },
  CIDS_ENTRIES_READ: { capacity: 36000, refillPerSecond: 1200 * PER_MINUTE },
  INFRACTION_REPORTS_READ: { capacity: 18000, refillPerSecond: 600 * PER_MINUTE },
  INFRACTION_REPORTS_WRITE: { capacity: 36000, refillPerSecond: 1200 * PER_MINUTE },
  INFRACTION_REPORTS_LIST_WITH_ROLE: { capacity: 200, refillPerSecond: 40 * PER_MINUTE },
  INFRACTION_REPORTS_LIST_WITHOUT_ROLE: { capacity: 50, refillPerSecond: 10 * PER_MINUTE },
  KEYS_CHECK: { capacity: 70, refillPerSecond: 70 * PER_MINUTE },
  REFUNDS_READ: { capacity: 36000, refillPerSecond: 1200 * PER_MINUTE },
  REFUNDS_WRITE: { capacity: 72000, refillPerSecond: 2400 * PER_MINUTE },
  REFUND_LIST_WITH_ROLE: { capacity: 200, refillPerSecond: 40 * PER_MINUTE },
  REFUND_LIST_WITHOUT_ROLE: { capacity: 50, refillPerSecond: 10 * PER_MINUTE },
  FRAUD_MARKERS_READ: { capacity: 18000, refillPerSecond: 600 * PER_MINUTE },
  FRAUD_MARKERS_WRITE: { capacity: 36000, refillPerSecond: 1200 * PER_MINUTE },
  FRAUD_MARKERS_LIST: { capacity: 18000, refillPerSecond: 600 * PER_MINUTE },
  PERSONS_STATISTICS_READ: { capacity: 36000, refillPerSecond: 12000 * PER_MINUTE },
  POLICIES_READ: { capacity: 200, refillPerSecond: 60 * PER_MINUTE },
  POLICIES_LIST: { capacity: 20, refillPerSecond: 6 * PER_MINUTE },
  EVENT_LIST: { capacity: 200, refillPerSecond: 40 * PER_MINUTE }
};

describe('DICT policy catalog', () => {
  it('has a definition for every policy code', () => {
    for (const policyCode of DICT_POLICY_CODES) {
      const definition = getPolicyDefinition(policyCode);
      expect(definition.code).toBe(policyCode);
    }
  });

  it('resolves user anti-scan rates for PF and PJ categories', () => {
    for (const finalUserCategory of FINAL_USER_CATEGORIES) {
      const config = resolvePolicyRateConfig('ENTRIES_READ_USER_ANTISCAN', {
        finalUserCategory,
        participantCategory: 'A'
      });

      if (finalUserCategory === 'PF') {
        expect(config.capacity).toBe(100);
        expect(config.refillPerSecond).toBeCloseTo(2 * PER_MINUTE, 12);
      } else {
        expect(config.capacity).toBe(1000);
        expect(config.refillPerSecond).toBeCloseTo(20 * PER_MINUTE, 12);
      }
    }
  });

  it('resolves participant anti-scan rates for all A..H categories', () => {
    const expectedByCategory: Record<string, { capacity: number; refillPerSecond: number }> = {
      A: { capacity: 50000, refillPerSecond: 25000 * PER_MINUTE },
      B: { capacity: 40000, refillPerSecond: 20000 * PER_MINUTE },
      C: { capacity: 30000, refillPerSecond: 15000 * PER_MINUTE },
      D: { capacity: 16000, refillPerSecond: 8000 * PER_MINUTE },
      E: { capacity: 5000, refillPerSecond: 2500 * PER_MINUTE },
      F: { capacity: 500, refillPerSecond: 250 * PER_MINUTE },
      G: { capacity: 250, refillPerSecond: 25 * PER_MINUTE },
      H: { capacity: 50, refillPerSecond: 2 * PER_MINUTE }
    };

    for (const participantCategory of PARTICIPANT_CATEGORIES) {
      const config = resolvePolicyRateConfig('ENTRIES_READ_PARTICIPANT_ANTISCAN', {
        participantCategory
      });
      const expected = expectedByCategory[participantCategory];

      expect(config.capacity).toBe(expected.capacity);
      expect(config.refillPerSecond).toBeCloseTo(expected.refillPerSecond, 12);
    }
  });

  it('resolves fixed policies with expected refill rates and capacities', () => {
    for (const [policyCode, expected] of Object.entries(FIXED_POLICY_EXPECTATIONS)) {
      const config = resolvePolicyRateConfig(policyCode as DictPolicyCode, {
        participantCategory: 'A'
      });

      expect(config.capacity).toBe(expected.capacity);
      expect(config.refillPerSecond).toBeCloseTo(expected.refillPerSecond, 12);
    }
  });
});
