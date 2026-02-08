interface BucketGaugeProps {
  available: number;
  max: number;
}

export function BucketGauge({ available, max }: BucketGaugeProps) {
  const pct = max > 0 ? available / max : 0;
  const angle = pct * 360;
  const radius = 60;
  const cx = 70;
  const cy = 70;

  let color = 'var(--color-primary)';
  if (pct <= 0.25) color = 'var(--color-danger)';
  else if (pct <= 0.5) color = 'var(--color-warning)';

  const endAngle = (angle - 90) * (Math.PI / 180);
  const startAngle = -90 * (Math.PI / 180);
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;

  const pathD =
    pct >= 1
      ? ''
      : pct <= 0
        ? ''
        : `M ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2}`;

  return (
    <div className="gauge-container">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
        {pct >= 1 ? (
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={color} strokeWidth="10" />
        ) : pathD ? (
          <path d={pathD} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
        ) : null}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--color-text)">
          {available}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">
          / {max}
        </text>
      </svg>
      <span className="gauge-label">Available Tokens</span>
    </div>
  );
}
