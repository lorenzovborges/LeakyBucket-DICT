import { BucketProgressBar } from './BucketProgressBar';

interface BucketState {
  policyCode: string;
  scopeType: string;
  scopeKey: string;
  tokens: number;
  capacity: number;
  refillPerSecond: number;
  lastRefillAt: string;
}

interface BucketTableProps {
  buckets: readonly BucketState[];
}

export function BucketTable({ buckets }: BucketTableProps) {
  if (buckets.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
        No bucket states found. Run some DICT operations first.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <table className="bucket-table">
        <thead>
          <tr>
            <th>Policy</th>
            <th>Scope</th>
            <th>Key</th>
            <th>Tokens</th>
            <th>Capacity</th>
            <th style={{ minWidth: 120 }}>Level</th>
            <th>Refill/s</th>
            <th>Last Refill</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((b, i) => (
            <tr key={i}>
              <td className="mono">{b.policyCode}</td>
              <td className="mono">{b.scopeType}</td>
              <td className="mono">{b.scopeKey}</td>
              <td className="mono">{b.tokens.toFixed(1)}</td>
              <td className="mono">{b.capacity}</td>
              <td>
                <BucketProgressBar tokens={b.tokens} capacity={b.capacity} />
              </td>
              <td className="mono">{b.refillPerSecond.toFixed(4)}</td>
              <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                {new Date(b.lastRefillAt).toLocaleTimeString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
