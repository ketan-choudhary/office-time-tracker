import type { DisplayStatus } from '@/utils/attendance';

const styles: Record<DisplayStatus, string> = {
  'Not Started': 'bg-surface-muted text-text-secondary',
  'In Progress': 'bg-accent/15 text-accent',
  Completed: 'bg-success/15 text-success',
  WFH: 'bg-success/15 text-success',
  Leave: 'bg-warning/15 text-warning',
  Holiday: 'bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa]',
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
