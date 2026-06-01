import { getOfficeHoursProgressColor } from '@/utils/attendance';
import type { DayProgress } from '@/utils/attendance';
import { ProgressRing } from './ProgressRing';

interface OfficeHoursProgressRingProps {
  progress: DayProgress;
}

export function OfficeHoursProgressRing({ progress }: OfficeHoursProgressRingProps) {
  const strokeClassName = getOfficeHoursProgressColor(progress.percent);

  return (
    <ProgressRing
      title="Today's Office Hours Progress"
      progress={progress}
      strokeClassName={strokeClassName}
      ringCaption="office"
    />
  );
}
