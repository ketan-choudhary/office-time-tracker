import { Card } from '@/components/ui/Card';
import type { SkipOfficeVerdict } from '@/utils/compliance';

interface SkipOfficeCardProps {
  verdict: SkipOfficeVerdict;
}

export function SkipOfficeCard({ verdict }: SkipOfficeCardProps) {
  const isYes = verdict.canSkip;

  return (
    <Card title="Can I Skip Office Tomorrow?">
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
      </div>
    </Card>
  );
}
