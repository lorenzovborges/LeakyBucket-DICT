interface StatusBadgeProps {
  status: 'success' | 'danger' | 'warning';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return <span className={`badge badge-${status}`}>{label}</span>;
}
