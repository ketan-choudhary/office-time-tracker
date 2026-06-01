import { Card } from '@/components/ui/Card';
import type { MonthComplianceSnapshot } from '@/utils/compliance';
import {
  getOfficeDaysComplianceBarColor,
  getOfficeDaysComplianceColor,
} from '@/utils/compliance';

interface OfficeDaysComplianceWidgetProps {
  snapshot: MonthComplianceSnapshot;
  subtitle?: string;
}

export function OfficeDaysComplianceWidget({
  snapshot,
  subtitle,
}: OfficeDaysComplianceWidgetProps) {
  const { officeDaysCompleted, officeDaysRequired, remainingOfficeDays } = snapshot;
  const colorClass = getOfficeDaysComplianceColor(officeDaysCompleted);
  const barClass = getOfficeDaysComplianceBarColor(officeDaysCompleted);
  const pct =
    officeDaysRequired > 0
      ? Math.min(100, Math.round((officeDaysCompleted / officeDaysRequired) * 100))
      : 0;

  return (
    <Card title="Office Days Progress" subtitle={subtitle}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`font-mono text-4xl font-bold tracking-tight ${colorClass}`}>
            {officeDaysCompleted}
            <span className="text-2xl font-semibold text-text-muted">
              {' '}
              / {officeDaysRequired}
            </span>
          </p>
          <p className="mt-1 text-sm text-text-secondary">OFFICE days this month</p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-3 text-right">
          <p className={`text-2xl font-bold ${colorClass}`}>{remainingOfficeDays}</p>
          <p className="text-xs font-medium text-text-muted">Remaining</p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Card>
  );
}
