import { StatusBadge } from '../shared/StatusBadge';
import { ImpactsTable } from './ImpactsTable';

interface Impact {
  policyCode: string;
  scopeType: string;
  scopeKey: string;
  costApplied: number;
  tokensBefore: number;
  tokensAfter: number;
  capacity: number;
  refillPerSecond: number;
}

interface DictResult {
  allowed: boolean;
  httpStatus: number;
  blockedByPolicies: readonly string[];
  impacts: readonly Impact[];
}

interface DictResultPanelProps {
  result: DictResult;
}

export function DictResultPanel({ result }: DictResultPanelProps) {
  return (
    <div className="card">
      <div className="dict-result-header">
        <StatusBadge
          status={result.allowed ? 'success' : 'danger'}
          label={result.allowed ? 'ALLOWED' : 'BLOCKED'}
        />
        <span className="http-status" style={{ color: result.httpStatus >= 400 ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}>
          HTTP {result.httpStatus}
        </span>
      </div>

      {result.blockedByPolicies.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <strong style={{ fontSize: 13 }}>Blocked by:</strong>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {result.blockedByPolicies.map((p) => (
              <span key={p} className="badge badge-danger" style={{ fontSize: 11 }}>
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Policy Impacts</h4>
      <ImpactsTable impacts={result.impacts} />
    </div>
  );
}
