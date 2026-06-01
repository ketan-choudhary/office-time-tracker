import { formatDurationHHMM } from '@/utils/time';
import type { DayProgress } from '@/utils/attendance';

interface ProgressRingProps {
  title: string;
  progress: DayProgress;
  strokeClassName?: string;
  ringCaption?: string;
}

export function ProgressRing({
  title,
  progress,
  strokeClassName = 'text-accent',
  ringCaption = 'complete',
}: ProgressRingProps) {
  const { currentMinutes, targetMinutes, percent } = progress;
  const ringPercent = Math.min(100, percent);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (ringPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-center text-sm font-semibold text-text-primary">{title}</p>
      <div className="relative h-[120px] w-[120px] shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-surface-muted"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-all duration-700 ease-out ${strokeClassName}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
          <span className="text-2xl font-bold tracking-tight text-text-primary">
            {percent}%
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
            {ringCaption}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-mono text-lg font-bold tracking-tight text-text-primary">
          {formatDurationHHMM(currentMinutes)}
          <span className="font-normal text-text-muted"> / </span>
          {formatDurationHHMM(targetMinutes)}
        </p>
      </div>
    </div>
  );
}
