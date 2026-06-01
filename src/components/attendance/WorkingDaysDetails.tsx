import { Card } from '@/components/ui/Card';
import type { MonthComplianceSnapshot } from '@/utils/compliance';

interface WorkingDaysDetailsProps {
  breakdown: MonthComplianceSnapshot;
  officeDaysRequired: number;
  subtitle?: string;
}

export function WorkingDaysDetails({
  breakdown,
  officeDaysRequired,
  subtitle,
}: WorkingDaysDetailsProps) {
  const { workingDays, weekendDays, holidayDays, wfhEligible } = breakdown;

  return (
    <Card title="Working Days" subtitle={subtitle}>
      <dl className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium text-text-muted">Working Days</dt>
          <dd className="mt-1 font-mono text-2xl font-bold text-accent">{workingDays}</dd>
        </div>
        <div className="rounded-xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium text-text-muted">Weekends</dt>
          <dd className="mt-1 font-mono text-2xl font-bold text-text-secondary">{weekendDays}</dd>
        </div>
        <div className="rounded-xl bg-surface-muted px-3 py-3">
          <dt className="text-xs font-medium text-text-muted">Holidays</dt>
          <dd className="mt-1 font-mono text-2xl font-bold text-[#7c3aed]">{holidayDays}</dd>
        </div>
      </dl>
      <p className="mt-3 text-center text-xs text-text-muted">
        WFH eligible: {workingDays} working days − {officeDaysRequired} office requirement ={' '}
        <span className="font-semibold text-text-secondary">{wfhEligible}</span>
      </p>
    </Card>
  );
}
