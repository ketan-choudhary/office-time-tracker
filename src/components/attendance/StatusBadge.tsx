import type { DayStatus } from '@/utils/attendance';

const styles: Record<DayStatus, string> = {
  'Not Started': 'bg-surface-muted text-text-secondary',
  Working: 'bg-accent/15 text-accent',
  Completed: 'bg-success/15 text-success',
};

export function StatusBadge({ status }: { status: DayStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
