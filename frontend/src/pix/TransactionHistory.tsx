import { StatusBadge } from '../shared/StatusBadge';

export interface HistoryEntry {
  id: number;
  pixKey: string;
  amount: number;
  status: string;
  time: string;
}

interface TransactionHistoryProps {
  entries: HistoryEntry[];
}

function statusToBadge(status: string) {
  switch (status) {
    case 'SUCCESS':
      return { status: 'success' as const, label: 'OK' };
    case 'RATE_LIMITED':
      return { status: 'warning' as const, label: '429' };
    default:
      return { status: 'danger' as const, label: 'FAIL' };
  }
}

export function TransactionHistory({ entries }: TransactionHistoryProps) {
  if (entries.length === 0) return null;

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Transaction History</h3>
      <div className="history-list">
        {entries.map((e) => {
          const badge = statusToBadge(e.status);
          return (
            <div key={e.id} className="history-item">
              <span className="history-key">{e.pixKey}</span>
              <span>R$ {e.amount.toFixed(2)}</span>
              <StatusBadge status={badge.status} label={badge.label} />
              <span className="history-time">{e.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
