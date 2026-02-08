import { describe, expect, it } from 'vitest';

import {
  DICT_KEY_TYPES,
  OPERATIONS_NEEDING_PAYER,
  OPERATIONS_WITH_ROLE_FILTER,
} from './constants';

describe('DICT frontend constants', () => {
  it('keeps payer-required operations aligned with backend resolver', () => {
    expect([...OPERATIONS_NEEDING_PAYER]).toEqual(['GET_ENTRY']);
  });

  it('keeps role-filter operations aligned with backend resolver', () => {
    expect([...OPERATIONS_WITH_ROLE_FILTER].sort()).toEqual([
      'LIST_CLAIMS',
      'LIST_INFRACTION_REPORTS',
      'LIST_REFUNDS',
    ]);
    expect(OPERATIONS_WITH_ROLE_FILTER.has('LIST_FRAUD_MARKERS')).toBe(false);
  });

  it('exposes only supported DICT key types', () => {
    expect(DICT_KEY_TYPES).toEqual(['EMAIL', 'PHONE', 'CPF', 'CNPJ', 'EVP']);
  });
});
