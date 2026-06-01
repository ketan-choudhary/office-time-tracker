import { formatDisplayDate } from '@/utils/time';

interface DateSelectorProps {
  selectedDate: string;
  isToday: boolean;
  onDateChange: (date: string) => void;
  onPreviousDay: () => void;
  onToday: () => void;
  onNextDay: () => void;
}

export function DateSelector({
  selectedDate,
  isToday,
  onDateChange,
  onPreviousDay,
  onToday,
  onNextDay,
}: DateSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="dashboard-date"
          className="mb-1.5 block text-sm font-medium text-text-secondary"
        >
          Date
        </label>
        <input
          id="dashboard-date"
          type="date"
          className="input-field"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
        />
        <p className="mt-1 text-xs text-text-muted">
          {formatDisplayDate(selectedDate)}
          {isToday && ' · Today'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={onPreviousDay} className="btn-secondary px-2 text-sm">
          ‹ Prev
        </button>
        <button
          type="button"
          onClick={onToday}
          className={`min-h-[48px] rounded-xl px-2 text-sm font-semibold transition active:scale-[0.98] ${
            isToday
              ? 'bg-accent text-white'
              : 'border border-border bg-surface-elevated text-text-primary'
          }`}
          disabled={isToday}
        >
          Today
        </button>
        <button type="button" onClick={onNextDay} className="btn-secondary px-2 text-sm">
          Next ›
        </button>
      </div>
    </div>
  );
}
