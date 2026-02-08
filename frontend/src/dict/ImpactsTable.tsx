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

interface ImpactsTableProps {
  impacts: readonly Impact[];
}

function levelClass(tokens: number, capacity: number) {
  const pct = capacity > 0 ? tokens / capacity : 0;
  if (pct <= 0.25) return 'level-critical';
  if (pct <= 0.5) return 'level-warn';
  return 'level-ok';
}

export function ImpactsTable({ impacts }: ImpactsTableProps) {
  if (impacts.length === 0) return <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>No impacts</p>;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="impacts-table">
        <thead>
          <tr>
            <th>Policy</th>
            <th>Scope</th>
            <th>Cost</th>
            <th>Before</th>
            <th>After</th>
            <th>Capacity</th>
            <th>Refill/s</th>
            <th style={{ minWidth: 100 }}>Level</th>
          </tr>
        </thead>
        <tbody>
          {impacts.map((imp, i) => {
            const pct = imp.capacity > 0 ? (imp.tokensAfter / imp.capacity) * 100 : 0;
            return (
              <tr key={i}>
                <td className="mono">{imp.policyCode}</td>
                <td className="mono">{imp.scopeType}:{imp.scopeKey}</td>
                <td className="mono">{imp.costApplied}</td>
                <td className="mono">{imp.tokensBefore.toFixed(1)}</td>
                <td className="mono">{imp.tokensAfter.toFixed(1)}</td>
                <td className="mono">{imp.capacity}</td>
                <td className="mono">{imp.refillPerSecond.toFixed(4)}</td>
                <td>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar-fill ${levelClass(imp.tokensAfter, imp.capacity)}`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
