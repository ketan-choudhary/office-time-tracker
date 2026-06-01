import { useEffect, useState } from 'react';

interface LeaveHolidayModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (dayType: 'LEAVE' | 'HOLIDAY') => void;
  saving?: boolean;
}

export function LeaveHolidayModal({ open, onClose, onSave, saving }: LeaveHolidayModalProps) {
  const [selection, setSelection] = useState<'LEAVE' | 'HOLIDAY'>('LEAVE');

  useEffect(() => {
    if (open) setSelection('LEAVE');
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leave-holiday-title"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="leave-holiday-title" className="text-lg font-bold text-text-primary">
          Mark Day As
        </h3>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 transition has-[:checked]:border-warning has-[:checked]:bg-warning/10">
            <input
              type="radio"
              name="dayType"
              value="LEAVE"
              checked={selection === 'LEAVE'}
              onChange={() => setSelection('LEAVE')}
              className="h-5 w-5 accent-warning"
            />
            <span className="font-medium text-text-primary">Leave</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-muted px-4 py-3 transition has-[:checked]:border-[#7c3aed] has-[:checked]:bg-[#7c3aed]/10">
            <input
              type="radio"
              name="dayType"
              value="HOLIDAY"
              checked={selection === 'HOLIDAY'}
              onChange={() => setSelection('HOLIDAY')}
              className="h-5 w-5 accent-[#7c3aed]"
            />
            <span className="font-medium text-text-primary">Holiday</span>
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            disabled={saving}
            onClick={() => onSave(selection)}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
