import type { DayProgress } from '@/utils/attendance';
import { ProgressRing } from './ProgressRing';

interface DayProgressRingProps {
  progress: DayProgress;
}

export function DayProgressRing({ progress }: DayProgressRingProps) {
  return (
    <ProgressRing
      title="Daily Target Progress"
      progress={progress}
      strokeClassName="text-accent"
      ringCaption="daily"
    />
  );
}
