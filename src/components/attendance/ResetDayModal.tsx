import { formatLongDate } from '@/utils/time';

interface ResetDayModalProps {
  open: boolean;
  date: string;
  saving?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetDayModal({ open, date, saving, onClose, onConfirm }: ResetDayModalProps) {
  if (!open) return null;

  const displayDate = formatLongDate(date);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-day-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="card w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="reset-day-title" className="text-lg font-bold text-text-primary">
          Reset Attendance?
        </h3>
        <p className="mt-2 text-sm text-text-secondary">
          This will permanently remove all attendance information for:
        </p>
        <p className="mt-1 text-sm font-semibold text-text-primary">{displayDate}</p>
        <p className="mt-3 text-sm text-text-secondary">The following data will be cleared:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-text-secondary">
          <li>Punch In</li>
          <li>Punch Out</li>
          <li>WFH sessions</li>
          <li>Office sessions</li>
          <li>Leave status</li>
          <li>Holiday status</li>
        </ul>
        <p className="mt-3 text-sm font-medium text-danger">This action cannot be undone.</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="btn-secondary flex-1"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger flex-1"
            disabled={saving}
            onClick={onConfirm}
          >
            {saving ? 'Resetting…' : 'Reset Day'}
          </button>
        </div>
      </div>
    </div>
  );
}
