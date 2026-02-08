interface BucketProgressBarProps {
  tokens: number;
  capacity: number;
}

export function BucketProgressBar({ tokens, capacity }: BucketProgressBarProps) {
  const pct = capacity > 0 ? (tokens / capacity) * 100 : 0;
  let level = 'level-ok';
  if (pct <= 25) level = 'level-critical';
  else if (pct <= 50) level = 'level-warn';

  return (
    <div className="progress-bar">
      <div
        className={`progress-bar-fill ${level}`}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}
