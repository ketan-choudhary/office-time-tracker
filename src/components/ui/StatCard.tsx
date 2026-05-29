interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'success' | 'warning' | 'danger';
}

const accentColors = {
  default: 'text-text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
};

export function StatCard({ label, value, hint, accent = 'default' }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${accentColors[accent]}`}>{value}</span>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </div>
  );
}
