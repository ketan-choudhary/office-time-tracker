import { formatDurationFromHours } from '@/utils/time';

type DurationKind = 'office' | 'wfh' | 'total';

const styles: Record<DurationKind, string> = {
  office: 'bg-accent/15 text-accent',
  wfh: 'bg-success/15 text-success',
  total: 'bg-surface-muted text-text-primary',
};

interface DurationChipProps {
  kind: DurationKind;
  hours: number;
  className?: string;
}

export function DurationChip({ kind, hours, className = '' }: DurationChipProps) {
  if (hours <= 0 && kind !== 'total') {
    return <span className="text-text-muted">—</span>;
  }

  return (
    <span
      className={`inline-block rounded-lg px-2 py-0.5 font-mono text-sm font-semibold tabular-nums ${styles[kind]} ${className}`}
    >
      {formatDurationFromHours(hours)}
    </span>
  );
}
