import { StatusBadge } from '../shared/StatusBadge';

interface PixResult {
  status: string;
  message: string;
  pixKeyFound: boolean;
  ownerName: string | null;
  bankName: string | null;
  consumedToken: boolean;
  requestedAt: string;
}

interface PixResultCardProps {
  result: PixResult;
}

function statusToBadge(status: string) {
  switch (status) {
    case 'SUCCESS':
      return { status: 'success' as const, label: 'Success' };
    case 'RATE_LIMITED':
      return { status: 'warning' as const, label: 'Rate Limited' };
    default:
      return { status: 'danger' as const, label: 'Failed' };
  }
}

export function PixResultCard({ result }: PixResultCardProps) {
  const badge = statusToBadge(result.status);

  return (
    <div className="card pix-result">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <StatusBadge status={badge.status} label={badge.label} />
        <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{result.message}</span>
      </div>
      <dl className="pix-result-grid">
        {result.ownerName && (
          <div className="pix-result-item">
            <dt>Owner</dt>
            <dd>{result.ownerName}</dd>
          </div>
        )}
        {result.bankName && (
          <div className="pix-result-item">
            <dt>Bank</dt>
            <dd>{result.bankName}</dd>
          </div>
        )}
        <div className="pix-result-item">
          <dt>Key Found</dt>
          <dd>{result.pixKeyFound ? 'Yes' : 'No'}</dd>
        </div>
        <div className="pix-result-item">
          <dt>Token Consumed</dt>
          <dd>{result.consumedToken ? 'Yes' : 'No'}</dd>
        </div>
      </dl>
    </div>
  );
}
