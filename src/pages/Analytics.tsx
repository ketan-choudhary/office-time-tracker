import { useMemo } from 'react';
import { format, subMonths } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { AttendanceChart } from '@/components/charts/AttendanceChart';
import { HoursChart } from '@/components/charts/HoursChart';
import { useAllRecords, useSettings } from '@/hooks/useRecords';
import { isOfficeDay } from '@/utils/calculations';
import {
  averageTimeStrings,
  currentMonthRange,
  formatDurationFromHours,
  formatTime24h,
} from '@/utils/time';

export function Analytics() {
  const records = useAllRecords() ?? [];
  const settings = useSettings();

  const { start, end } = currentMonthRange();
  const monthRecords = records.filter((r) => r.date >= start && r.date <= end);
  const completeRecords = monthRecords.filter((r) => r.status === 'complete');

  const averages = useMemo(() => {
    const punchIns = completeRecords.map((r) => r.punchIn);
    const punchOuts = completeRecords.map((r) => r.punchOut);
    const avgIn = averageTimeStrings(punchIns);
    const avgOut = averageTimeStrings(punchOuts);
    const avgOffice =
      completeRecords.length > 0
        ? completeRecords.reduce((s, r) => s + r.officeHours, 0) / completeRecords.length
        : 0;
    const avgTotal =
      completeRecords.length > 0
        ? completeRecords.reduce((s, r) => s + r.totalHours, 0) / completeRecords.length
        : 0;
    return { avgIn, avgOut, avgOffice, avgTotal };
  }, [completeRecords]);

  const officeAttendancePct = useMemo(() => {
    const required = settings?.officeDaysRequiredPerMonth ?? 10;
    const officeDays = monthRecords.filter(isOfficeDay).length;
    return required > 0 ? Math.min(100, Math.round((officeDays / required) * 100)) : 0;
  }, [monthRecords, settings]);

  const monthlyTrend = useMemo(() => {
    const months: { month: string; percentage: number; officeDays: number; required: number }[] =
      [];
    const required = settings?.officeDaysRequiredPerMonth ?? 10;

    for (let i = 5; i >= 0; i--) {
      const ref = subMonths(new Date(), i);
      const mStart = format(new Date(ref.getFullYear(), ref.getMonth(), 1), 'yyyy-MM-dd');
      const mEnd = format(new Date(ref.getFullYear(), ref.getMonth() + 1, 0), 'yyyy-MM-dd');
      const mRecords = records.filter((r) => r.date >= mStart && r.date <= mEnd);
      const officeDays = mRecords.filter(isOfficeDay).length;
      months.push({
        month: format(ref, 'MMM'),
        percentage: required > 0 ? Math.min(100, Math.round((officeDays / required) * 100)) : 0,
        officeDays,
        required,
      });
    }
    return months;
  }, [records, settings]);

  const last30 = useMemo(() => {
    const cutoff = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
    return records.filter((r) => r.date >= cutoff).slice(0, 30).reverse();
  }, [records]);

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Analytics</p>
        <h2 className="page-title mt-1">Performance Insights</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Avg Punch In"
          value={averages.avgIn ? formatTime24h(averages.avgIn) : '—'}
        />
        <StatCard
          label="Avg Punch Out"
          value={averages.avgOut ? formatTime24h(averages.avgOut) : '—'}
        />
        <StatCard
          label="Avg Office Hours"
          value={
            averages.avgOffice > 0 ? formatDurationFromHours(averages.avgOffice) : '—'
          }
        />
        <StatCard
          label="Avg Total Hours"
          value={
            averages.avgTotal > 0 ? formatDurationFromHours(averages.avgTotal) : '—'
          }
        />
      </div>

      <Card title="Office Attendance" subtitle="Current month">
        <p className="text-4xl font-bold text-accent">{officeAttendancePct}%</p>
        <p className="mt-1 text-sm text-text-secondary">
          {monthRecords.filter(isOfficeDay).length} of {settings?.officeDaysRequiredPerMonth ?? 10}{' '}
          required office days
        </p>
      </Card>

      <Card title="Monthly Attendance Trend" subtitle="Last 6 months">
        <AttendanceChart data={monthlyTrend} />
      </Card>

      <Card title="Hours Trend" subtitle="Recent entries">
        <HoursChart records={last30} />
      </Card>
    </div>
  );
}
