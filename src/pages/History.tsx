import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useAllRecords } from '@/hooks/useRecords';
import {
  currentMonthRange,
  formatDayName,
  formatTime12h,
  previousMonthRange,
} from '@/utils/time';

type FilterMode = 'current' | 'previous' | 'custom';

export function History() {
  const records = useAllRecords() ?? [];
  const [filter, setFilter] = useState<FilterMode>('current');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'current') {
      const { start, end } = currentMonthRange();
      return records.filter((r) => r.date >= start && r.date <= end);
    }
    if (filter === 'previous') {
      const { start, end } = previousMonthRange();
      return records.filter((r) => r.date >= start && r.date <= end);
    }
    if (customStart && customEnd) {
      return records.filter((r) => r.date >= customStart && r.date <= customEnd);
    }
    return records;
  }, [records, filter, customStart, customEnd]);

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">History</p>
        <h2 className="page-title mt-1">Attendance Log</h2>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2">
          {(['current', 'previous', 'custom'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                filter === mode
                  ? 'bg-accent text-white'
                  : 'bg-surface-muted text-text-secondary'
              }`}
            >
              {mode === 'current' ? 'This Month' : mode === 'previous' ? 'Last Month' : 'Custom'}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input
              type="date"
              className="input-field"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <input
              type="date"
              className="input-field"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}
      </Card>

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Day</th>
              <th className="px-2 py-2">WFH1 S</th>
              <th className="px-2 py-2">WFH1 E</th>
              <th className="px-2 py-2">In</th>
              <th className="px-2 py-2">Out</th>
              <th className="px-2 py-2">WFH2 S</th>
              <th className="px-2 py-2">WFH2 E</th>
              <th className="px-2 py-2">Office</th>
              <th className="px-2 py-2">WFH</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2">Late</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-8 text-center text-text-muted">
                  No records for this period.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border-subtle transition hover:bg-surface-muted/50"
                >
                  <td className="whitespace-nowrap px-2 py-2.5 font-medium">{r.date}</td>
                  <td className="px-2 py-2.5">{formatDayName(r.date)}</td>
                  <td className="px-2 py-2.5">{formatTime12h(r.wfh1Start)}</td>
                  <td className="px-2 py-2.5">{formatTime12h(r.wfh1End)}</td>
                  <td className="px-2 py-2.5">{formatTime12h(r.punchIn)}</td>
                  <td className="px-2 py-2.5">{formatTime12h(r.punchOut)}</td>
                  <td className="px-2 py-2.5">{formatTime12h(r.wfh2Start)}</td>
                  <td className="px-2 py-2.5">{formatTime12h(r.wfh2End)}</td>
                  <td className="px-2 py-2.5">{r.officeHours.toFixed(1)}h</td>
                  <td className="px-2 py-2.5">{r.wfhHours.toFixed(1)}h</td>
                  <td className="px-2 py-2.5 font-medium">{r.totalHours.toFixed(1)}h</td>
                  <td className="px-2 py-2.5">
                    {r.late ? (
                      <span className="text-danger">Yes</span>
                    ) : (
                      <span className="text-success">No</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 capitalize">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
