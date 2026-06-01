import { Card } from '@/components/ui/Card';
import type { WFHTomorrowVerdict } from '@/utils/compliance';

interface WFHTomorrowCardProps {
  verdict: WFHTomorrowVerdict;
}

export function WFHTomorrowCard({ verdict }: WFHTomorrowCardProps) {
  const isYes = verdict.canWFH;

  return (
    <Card title="Can I WFH Tomorrow?">
      <div
        className={`rounded-2xl px-4 py-4 ${
          isYes ? 'bg-success/10' : 'bg-warning/10'
        }`}
      >
        <p
          className={`text-3xl font-bold tracking-tight ${
            isYes ? 'text-success' : 'text-warning'
          }`}
        >
          {verdict.headline}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">{verdict.explanation}</p>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-surface-muted/80 px-2 py-1.5">
            <dt className="text-text-muted">Office days</dt>
            <dd className="font-mono font-semibold text-text-primary">
              {verdict.officeDaysCompleted}/{verdict.officeDaysRequired}
            </dd>
          </div>
          <div className="rounded-lg bg-surface-muted/80 px-2 py-1.5">
            <dt className="text-text-muted">WFH used</dt>
            <dd className="font-mono font-semibold text-text-primary">
              {verdict.wfhUsed}/{verdict.wfhEligible}
            </dd>
          </div>
          <div className="col-span-2 rounded-lg bg-surface-muted/80 px-2 py-1.5">
            <dt className="text-text-muted">Remaining WFH days</dt>
            <dd className="font-mono font-semibold text-text-primary">{verdict.remainingWFH}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
