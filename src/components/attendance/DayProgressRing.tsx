import { formatMinutesAsDuration } from '@/utils/time';
import type { DayProgress } from '@/utils/attendance';

interface DayProgressRingProps {
  progress: DayProgress;
  label?: string;
}

export function DayProgressRing({ progress, label = 'Daily goal' }: DayProgressRingProps) {
  const { currentMinutes, targetMinutes, percent } = progress;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-[140px] w-[140px] shrink-0">
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
            className="text-accent transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tight text-text-primary">{percent}%</span>
          <span className="text-xs font-medium text-text-muted">{label}</span>
        </div>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-2xl font-bold tracking-tight text-text-primary">
          {formatMinutesAsDuration(currentMinutes)}
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          of {formatMinutesAsDuration(targetMinutes)} target
        </p>
      </div>
    </div>
  );
}
