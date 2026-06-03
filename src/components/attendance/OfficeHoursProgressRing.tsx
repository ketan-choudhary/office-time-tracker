import { useEffect, useState } from 'react';
import {
  getOfficeHoursProgressColor,
  getOfficeHoursCountdown,
  type OfficeHoursCountdown,
  type ProgressOptions,
} from '@/utils/attendance';
import type { AttendanceRecord } from '@/types';
import { formatDurationHHMM, formatTime12hWithAMPM } from '@/utils/time';

interface OfficeHoursProgressRingProps {
  record: AttendanceRecord | null | undefined;
  progressOptions?: ProgressOptions;
}

export function OfficeHoursProgressRing({
  record,
  progressOptions,
}: OfficeHoursProgressRingProps) {
  const [countdown, setCountdown] = useState<OfficeHoursCountdown | null>(
    () => getOfficeHoursCountdown(record, progressOptions),
  );

  useEffect(() => {
    // Update countdown if data changes
    setCountdown(getOfficeHoursCountdown(record, progressOptions));

    // Only set up live update interval if it's a live session AND punch out hasn't happened yet
    if (!progressOptions?.live || !record?.punchIn || record?.punchOut) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown(getOfficeHoursCountdown(record, progressOptions));
    }, 10000); // Update every 10 seconds during work session

    return () => clearInterval(interval);
  }, [record, progressOptions]);

  if (!countdown) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-[120px] w-[120px] shrink-0">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-surface-muted"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray="0 301.6"
              className="transition-all duration-700 ease-out text-surface-muted"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-text-primary">0%</span>
          </div>
        </div>
        <div className="h-3 w-full rounded-full bg-surface-muted" />
        <div className="flex justify-between gap-4 text-center text-xs">
          <div className="flex-1">
            <p className="text-text-muted mb-1">Punch In</p>
            <p className="font-semibold text-text-primary">—</p>
          </div>
          <div className="flex-1">
            <p className="text-text-muted mb-1">Punch Out</p>
            <p className="font-semibold text-text-primary">—</p>
          </div>
        </div>
      </div>
    );
  }

  const { remainingMinutes, percent, punchInTime, targetPunchOutTime } = countdown;
  const colorClassName = getOfficeHoursProgressColor(percent);
  const progressPercent = Math.min(100, percent);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;
  
  // Check if punch out is recorded
  const isPunchedOut = !!record?.punchOut;
  const displayPunchOutTime = isPunchedOut ? record.punchOut : targetPunchOutTime;

  return (
    <div className="flex flex-col gap-5">
      {/* Percentage Ring - TOP */}
      <div className="flex justify-center">
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
              className={`transition-all duration-700 ease-out ${colorClassName}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-text-primary">{percent}%</span>
          </div>
        </div>
      </div>

      {/* Countdown or Completed State */}
      <div className="flex flex-col items-center">
        {isPunchedOut ? (
          <p className={`text-2xl font-bold tracking-tight ${colorClassName}`}>COMPLETED</p>
        ) : (
          <p className={`text-6xl font-bold tabular-nums transition-colors duration-500 ${colorClassName}`}>
            {formatDurationHHMM(remainingMinutes)}
          </p>
        )}
      </div>

      {/* Leave At / Left At Time */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          {isPunchedOut ? 'Left At' : 'Leave At'}
        </p>
        <p className={`text-lg font-semibold ${colorClassName}`}>
          {formatTime12hWithAMPM(displayPunchOutTime)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-4 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClassName.replace('text-', 'bg-')}`}
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Punch times row - BOTTOM */}
      <div className="flex justify-between gap-4 text-center text-xs">
        <div className="flex-1">
          <p className="text-text-muted mb-1">Punch In</p>
          <p className="font-semibold text-text-primary">{formatTime12hWithAMPM(punchInTime)}</p>
        </div>
        <div className="flex-1">
          <p className="text-text-muted mb-1">Punch Out</p>
          <p className="font-semibold text-text-primary">{formatTime12hWithAMPM(displayPunchOutTime)}</p>
        </div>
      </div>
    </div>
  );
}
