import { Card } from '@/components/ui/Card';
import { formatTime24h } from '@/utils/time';

interface PunchSectionProps {
  title: string;
  subtitle: string;
  time?: string;
  workedDuration?: string | null;
  completionBadge?: 'In Progress' | 'Completed' | null;
  setTimeLabel?: string;
  canSetTime?: boolean;
  onSetTime?: () => void;
  canEdit?: boolean;
  onEdit?: () => void;
  primaryButton?: {
    label: string;
    hint?: string;
    className: string;
    disabled: boolean;
    onClick: () => void;
  };
}

export function PunchSection({
  title,
  subtitle,
  time,
  workedDuration,
  completionBadge,
  setTimeLabel,
  canSetTime,
  onSetTime,
  canEdit,
  onEdit,
  primaryButton,
}: PunchSectionProps) {
  const hasTime = Boolean(time);

  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>
        </div>
        {completionBadge && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              completionBadge === 'Completed'
                ? 'bg-success/15 text-success'
                : 'bg-accent/15 text-accent'
            }`}
          >
            {completionBadge}
          </span>
        )}
      </div>

      {hasTime ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Recorded</p>
            <p className="text-xl font-bold tracking-tight text-text-primary">
              {formatTime24h(time!)}
            </p>
            {workedDuration && (
              <p className="mt-1 font-mono text-sm tabular-nums text-text-secondary">
                Worked: {workedDuration}
              </p>
            )}
          </div>
          {canEdit && onEdit && (
            <button type="button" className="btn-punch-edit" onClick={onEdit}>
              Edit
            </button>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-surface-muted px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Not recorded</p>
          {canSetTime && setTimeLabel && onSetTime && (
            <button type="button" className="btn-secondary mt-3 min-h-[48px] w-full text-base" onClick={onSetTime}>
              {setTimeLabel}
            </button>
          )}
        </div>
      )}

      {primaryButton && !hasTime && (
        <button
          type="button"
          className={`${primaryButton.className} mt-4`}
          disabled={primaryButton.disabled}
          onClick={primaryButton.onClick}
        >
          <span>{primaryButton.label}</span>
          {primaryButton.hint && (
            <span className="text-sm font-normal opacity-90">{primaryButton.hint}</span>
          )}
        </button>
      )}
    </Card>
  );
}
