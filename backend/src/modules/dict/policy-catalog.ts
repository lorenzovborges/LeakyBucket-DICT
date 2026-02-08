import type {
  DictPolicyCode,
  DictScopeType,
  FinalUserCategory,
  ParticipantCategory,
  PolicyRateConfig
} from './dict.types';

interface PolicyDefinition {
  code: DictPolicyCode;
  scopeType: DictScopeType;
  configType: 'FIXED' | 'USER_CATEGORY' | 'PARTICIPANT_CATEGORY';
  fixedConfig?: PolicyRateConfig;
}

interface PolicyConfigContext {
  finalUserCategory?: FinalUserCategory;
  participantCategory: ParticipantCategory;
}

function perMinute(tokens: number): number {
  return tokens / 60;
}

function perDay(tokens: number): number {
  return tokens / (24 * 60 * 60);
}

const USER_CATEGORY_CONFIG: Record<FinalUserCategory, PolicyRateConfig> = {
  PF: {
    refillPerSecond: perMinute(2),
    capacity: 100
  },
  PJ: {
    refillPerSecond: perMinute(20),
    capacity: 1000
  }
};

const PARTICIPANT_CATEGORY_CONFIG: Record<ParticipantCategory, PolicyRateConfig> = {
  A: { refillPerSecond: perMinute(25000), capacity: 50000 },
  B: { refillPerSecond: perMinute(20000), capacity: 40000 },
  C: { refillPerSecond: perMinute(15000), capacity: 30000 },
  D: { refillPerSecond: perMinute(8000), capacity: 16000 },
  E: { refillPerSecond: perMinute(2500), capacity: 5000 },
  F: { refillPerSecond: perMinute(250), capacity: 500 },
  G: { refillPerSecond: perMinute(25), capacity: 250 },
  H: { refillPerSecond: perMinute(2), capacity: 50 }
};

const POLICY_DEFINITIONS: Record<DictPolicyCode, PolicyDefinition> = {
  ENTRIES_READ_USER_ANTISCAN: {
    code: 'ENTRIES_READ_USER_ANTISCAN',
    scopeType: 'USER',
    configType: 'USER_CATEGORY'
  },
  ENTRIES_READ_USER_ANTISCAN_V2: {
    code: 'ENTRIES_READ_USER_ANTISCAN_V2',
    scopeType: 'USER',
    configType: 'USER_CATEGORY'
  },
  ENTRIES_READ_PARTICIPANT_ANTISCAN: {
    code: 'ENTRIES_READ_PARTICIPANT_ANTISCAN',
    scopeType: 'PSP',
    configType: 'PARTICIPANT_CATEGORY'
  },
  ENTRIES_STATISTICS_READ: {
    code: 'ENTRIES_STATISTICS_READ',
    scopeType: 'PSP',
    configType: 'PARTICIPANT_CATEGORY'
  },
  ENTRIES_WRITE: {
    code: 'ENTRIES_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(1200), capacity: 36000 }
  },
  ENTRIES_UPDATE: {
    code: 'ENTRIES_UPDATE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(600), capacity: 600 }
  },
  CLAIMS_READ: {
    code: 'CLAIMS_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(600), capacity: 18000 }
  },
  CLAIMS_WRITE: {
    code: 'CLAIMS_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(1200), capacity: 36000 }
  },
  CLAIMS_LIST_WITH_ROLE: {
    code: 'CLAIMS_LIST_WITH_ROLE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(40), capacity: 200 }
  },
  CLAIMS_LIST_WITHOUT_ROLE: {
    code: 'CLAIMS_LIST_WITHOUT_ROLE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(10), capacity: 50 }
  },
  SYNC_VERIFICATIONS_WRITE: {
    code: 'SYNC_VERIFICATIONS_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(10), capacity: 50 }
  },
  CIDS_FILES_WRITE: {
    code: 'CIDS_FILES_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perDay(40), capacity: 200 }
  },
  CIDS_FILES_READ: {
    code: 'CIDS_FILES_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(10), capacity: 50 }
  },
  CIDS_EVENTS_LIST: {
    code: 'CIDS_EVENTS_LIST',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(20), capacity: 100 }
  },
  CIDS_ENTRIES_READ: {
    code: 'CIDS_ENTRIES_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(1200), capacity: 36000 }
  },
  INFRACTION_REPORTS_READ: {
    code: 'INFRACTION_REPORTS_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(600), capacity: 18000 }
  },
  INFRACTION_REPORTS_WRITE: {
    code: 'INFRACTION_REPORTS_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(1200), capacity: 36000 }
  },
  INFRACTION_REPORTS_LIST_WITH_ROLE: {
    code: 'INFRACTION_REPORTS_LIST_WITH_ROLE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(40), capacity: 200 }
  },
  INFRACTION_REPORTS_LIST_WITHOUT_ROLE: {
    code: 'INFRACTION_REPORTS_LIST_WITHOUT_ROLE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(10), capacity: 50 }
  },
  KEYS_CHECK: {
    code: 'KEYS_CHECK',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(70), capacity: 70 }
  },
  REFUNDS_READ: {
    code: 'REFUNDS_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(1200), capacity: 36000 }
  },
  REFUNDS_WRITE: {
    code: 'REFUNDS_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(2400), capacity: 72000 }
  },
  REFUND_LIST_WITH_ROLE: {
    code: 'REFUND_LIST_WITH_ROLE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(40), capacity: 200 }
  },
  REFUND_LIST_WITHOUT_ROLE: {
    code: 'REFUND_LIST_WITHOUT_ROLE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(10), capacity: 50 }
  },
  FRAUD_MARKERS_READ: {
    code: 'FRAUD_MARKERS_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(600), capacity: 18000 }
  },
  FRAUD_MARKERS_WRITE: {
    code: 'FRAUD_MARKERS_WRITE',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(1200), capacity: 36000 }
  },
  FRAUD_MARKERS_LIST: {
    code: 'FRAUD_MARKERS_LIST',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(600), capacity: 18000 }
  },
  PERSONS_STATISTICS_READ: {
    code: 'PERSONS_STATISTICS_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(12000), capacity: 36000 }
  },
  POLICIES_READ: {
    code: 'POLICIES_READ',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(60), capacity: 200 }
  },
  POLICIES_LIST: {
    code: 'POLICIES_LIST',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(6), capacity: 20 }
  },
  EVENT_LIST: {
    code: 'EVENT_LIST',
    scopeType: 'PSP',
    configType: 'FIXED',
    fixedConfig: { refillPerSecond: perMinute(40), capacity: 200 }
  }
};

export function getPolicyDefinition(policyCode: DictPolicyCode): PolicyDefinition {
  return POLICY_DEFINITIONS[policyCode];
}

export function resolvePolicyRateConfig(
  policyCode: DictPolicyCode,
  context: PolicyConfigContext
): PolicyRateConfig {
  const definition = getPolicyDefinition(policyCode);

  if (definition.configType === 'FIXED') {
    if (!definition.fixedConfig) {
      throw new Error(`Policy ${policyCode} missing fixed configuration`);
    }

    return definition.fixedConfig;
  }

  if (definition.configType === 'USER_CATEGORY') {
    if (!context.finalUserCategory) {
      throw new Error(`Policy ${policyCode} requires final user category`);
    }

    return USER_CATEGORY_CONFIG[context.finalUserCategory];
  }

  return PARTICIPANT_CATEGORY_CONFIG[context.participantCategory];
}
