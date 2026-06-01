import { useEffect, useState } from 'react';

interface PunchTimeModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  initialTime: string;
  saving?: boolean;
  onClose: () => void;
  onSave: (time: string) => void;
}

export function PunchTimeModal({
  open,
  title,
  subtitle,
  initialTime,
  saving,
  onClose,
  onSave,
}: PunchTimeModalProps) {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    if (open) setTime(initialTime);
  }, [open, initialTime]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="punch-time-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="card w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="punch-time-title" className="text-lg font-bold text-text-primary">
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}

        <input
          type="time"
          className="input-field mt-4"
          value={time}
          disabled={saving}
          onChange={(e) => setTime(e.target.value)}
        />

        <div className="mt-5 flex gap-2">
          <button type="button" className="btn-secondary flex-1" disabled={saving} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={saving || !time}
            onClick={() => onSave(time)}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
