import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DurationChip } from '@/components/attendance/DurationChip';
import { useAllRecords } from '@/hooks/useRecords';
import { formatTimeLabel } from '@/utils/attendance';
import { currentMonthRange, formatDayName, previousMonthRange } from '@/utils/time';

type FilterMode = 'current' | 'previous' | 'custom';

function sumHours(
  records: { officeHours: number; wfhHours: number; totalHours: number }[],
  key: 'officeHours' | 'wfhHours' | 'totalHours',
): number {
  return records.reduce((sum, r) => sum + r[key], 0);
}

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

  const periodLabel = useMemo(() => {
    if (filter === 'current') return 'This month';
    if (filter === 'previous') return 'Last month';
    if (customStart && customEnd) return `${customStart} – ${customEnd}`;
    return 'All records';
  }, [filter, customStart, customEnd]);

  const totals = useMemo(
    () => ({
      office: sumHours(filtered, 'officeHours'),
      wfh: sumHours(filtered, 'wfhHours'),
      total: sumHours(filtered, 'totalHours'),
    }),
    [filtered],
  );

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

      <Card title="Period Summary" subtitle={periodLabel}>
        <div className="grid grid-cols-3 gap-3">
          <SummaryTotal
            label="Total Office Hours"
            hours={totals.office}
            kind="office"
          />
          <SummaryTotal label="Total WFH Hours" hours={totals.wfh} kind="wfh" />
          <SummaryTotal label="Total Hours" hours={totals.total} kind="total" />
        </div>
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
              <th className="px-2 py-2 text-accent">Office</th>
              <th className="px-2 py-2 text-success">WFH</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-text-muted">
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
                  <td className="px-2 py-2.5 font-mono tabular-nums">
                    {formatTimeLabel(r.wfh1Start)}
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">
                    {formatTimeLabel(r.wfh1End)}
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">
                    {formatTimeLabel(r.punchIn)}
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">
                    {formatTimeLabel(r.punchOut)}
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">
                    {formatTimeLabel(r.wfh2Start)}
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">
                    {formatTimeLabel(r.wfh2End)}
                  </td>
                  <td className="px-2 py-2.5">
                    <DurationChip kind="office" hours={r.officeHours} />
                  </td>
                  <td className="px-2 py-2.5">
                    <DurationChip kind="wfh" hours={r.wfhHours} />
                  </td>
                  <td className="px-2 py-2.5">
                    <DurationChip kind="total" hours={r.totalHours} />
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

function SummaryTotal({
  label,
  hours,
  kind,
}: {
  label: string;
  hours: number;
  kind: 'office' | 'wfh' | 'total';
}) {
  return (
    <div className="rounded-xl bg-surface-muted px-3 py-3 text-center">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <div className="mt-2 flex justify-center">
        <DurationChip kind={kind} hours={hours} className="text-base" />
      </div>
    </div>
  );
}
