import type { AttendanceRecord, DayType } from '@/types';
import { resolveDayType } from '@/utils/recordHelpers';

const badgeStyles: Record<DayType, string> = {
  OFFICE: 'bg-accent/15 text-accent',
  WFH: 'bg-success/15 text-success',
  LEAVE: 'bg-warning/15 text-warning',
  HOLIDAY: 'bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#a78bfa]',
};

interface DayTypeBadgeProps {
  dayType?: DayType;
  className?: string;
}

export function DayTypeBadge({ dayType = 'OFFICE', className = '' }: DayTypeBadgeProps) {
  const type = dayType ?? 'OFFICE';
  return (
    <span
      className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeStyles[type]} ${className}`}
    >
      {type}
    </span>
  );
}

export function DayTypeBadgeFromRecord({ record }: { record: AttendanceRecord }) {
  return <DayTypeBadge dayType={resolveDayType(record)} />;
}
