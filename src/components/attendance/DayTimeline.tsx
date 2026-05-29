import type { TimelineStep } from '@/utils/attendance';
import { formatTimeLabel } from '@/utils/attendance';

interface DayTimelineProps {
  steps: TimelineStep[];
}

const kindStyles: Record<TimelineStep['kind'], string> = {
  wfh: 'bg-accent/10 text-accent',
  office: 'bg-success/10 text-success',
  default: 'bg-surface-muted text-text-secondary',
};

export function DayTimeline({ steps }: DayTimelineProps) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
          {index < steps.length - 1 && (
            <span
              className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border"
              aria-hidden
            />
          )}
          <span
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${kindStyles[step.kind]}`}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-text-primary">{step.label}</p>
            <p
              className={`mt-0.5 text-lg font-semibold tracking-tight ${
                step.time ? 'text-text-primary' : 'text-text-muted'
              }`}
            >
              {formatTimeLabel(step.time)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
