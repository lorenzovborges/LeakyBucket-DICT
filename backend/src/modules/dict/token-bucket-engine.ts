import type { PolicyRateConfig } from './dict.types';

const EPSILON = 1e-9;

function round(value: number): number {
  return Number(value.toFixed(6));
}

export interface RefilledBucket {
  tokens: number;
  lastRefillAt: Date;
}

export function applyContinuousRefill(
  tokens: number,
  lastRefillAt: Date,
  config: PolicyRateConfig,
  now: Date
): RefilledBucket {
  const elapsedMs = now.getTime() - lastRefillAt.getTime();

  if (elapsedMs <= 0) {
    return {
      tokens: round(tokens),
      lastRefillAt
    };
  }

  const elapsedSeconds = elapsedMs / 1000;
  const replenished = tokens + elapsedSeconds * config.refillPerSecond;

  return {
    tokens: round(Math.min(config.capacity, replenished)),
    lastRefillAt: now
  };
}

export function hasEnoughTokens(tokens: number, cost: number): boolean {
  return tokens + EPSILON >= cost;
}

export function debitTokens(tokens: number, cost: number): number {
  return round(Math.max(0, tokens - cost));
}

export function creditTokens(tokens: number, credit: number, capacity: number): number {
  return round(Math.min(capacity, tokens + credit));
}
