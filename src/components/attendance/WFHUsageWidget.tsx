import { Card } from '@/components/ui/Card';
import type { MonthComplianceSnapshot } from '@/utils/compliance';
import { getWFHUsageBarColor, getWFHUsageColor } from '@/utils/compliance';

interface WFHUsageWidgetProps {
  snapshot: MonthComplianceSnapshot;
  subtitle?: string;
}

export function WFHUsageWidget({ snapshot, subtitle }: WFHUsageWidgetProps) {
  const { wfhUsed, wfhEligible, remainingWFH } = snapshot;
  const colorClass = getWFHUsageColor(wfhUsed, wfhEligible);
  const barClass = getWFHUsageBarColor(wfhUsed, wfhEligible);
  const pct =
    wfhEligible > 0 ? Math.min(100, Math.round((wfhUsed / wfhEligible) * 100)) : 0;

  return (
    <Card title="WFH Usage" subtitle={subtitle}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`font-mono text-4xl font-bold tracking-tight ${colorClass}`}>
            {wfhUsed}
            <span className="text-2xl font-semibold text-text-muted"> / {wfhEligible}</span>
          </p>
          <p className="mt-1 text-sm text-text-secondary">WFH days this month</p>
        </div>
        <div className="rounded-2xl bg-surface-muted px-4 py-3 text-right">
          <p className={`text-2xl font-bold ${colorClass}`}>{remainingWFH}</p>
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
