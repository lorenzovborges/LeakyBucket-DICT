import {
  applyContinuousRefill,
  creditTokens,
  debitTokens,
  hasEnoughTokens
} from '../src/modules/dict/token-bucket-engine';

describe('DICT token bucket engine', () => {
  it('refills continuously based on elapsed seconds', () => {
    const refilled = applyContinuousRefill(
      10,
      new Date('2026-01-01T00:00:00.000Z'),
      {
        capacity: 100,
        refillPerSecond: 2 / 60
      },
      new Date('2026-01-01T00:05:00.000Z')
    );

    expect(refilled.tokens).toBe(20);
    expect(refilled.lastRefillAt.toISOString()).toBe('2026-01-01T00:05:00.000Z');
  });

  it('never exceeds capacity after refill and credit', () => {
    const refilled = applyContinuousRefill(
      95,
      new Date('2026-01-01T00:00:00.000Z'),
      {
        capacity: 100,
        refillPerSecond: 100 / 60
      },
      new Date('2026-01-01T00:10:00.000Z')
    );

    expect(refilled.tokens).toBe(100);
    expect(creditTokens(99, 5, 100)).toBe(100);
  });

  it('handles debit and token sufficiency checks', () => {
    expect(hasEnoughTokens(10, 10)).toBe(true);
    expect(hasEnoughTokens(9.999999, 10)).toBe(false);
    expect(hasEnoughTokens(9, 10)).toBe(false);
    expect(debitTokens(10, 3)).toBe(7);
    expect(debitTokens(1, 5)).toBe(0);
  });
});
