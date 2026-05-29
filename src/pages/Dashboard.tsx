import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { HoursChart } from '@/components/charts/HoursChart';
import { useAllRecords, useSettings, useTodayRecord } from '@/hooks/useRecords';
import { isOfficeDay } from '@/utils/calculations';
import {
  currentMonthRange,
  formatDisplayDate,
  formatMinutesAsDuration,
  todayDateString,
} from '@/utils/time';

export function Dashboard() {
  const records = useAllRecords() ?? [];
  const settings = useSettings();
  const todayRecord = useTodayRecord();
  const today = todayDateString();

  const monthStats = useMemo(() => {
    const { start, end } = currentMonthRange();
    const monthRecords = records.filter((r) => r.date >= start && r.date <= end);
    const officeDays = monthRecords.filter(isOfficeDay).length;
    const required = settings?.officeDaysRequiredPerMonth ?? 10;
    const lateCount = monthRecords.filter((r) => r.late).length;
    const attendancePct =
      required > 0 ? Math.min(100, Math.round((officeDays / required) * 100)) : 0;

    return { monthRecords, officeDays, required, remaining: Math.max(0, required - officeDays), lateCount, attendancePct };
  }, [records, settings]);

  const todayStats = useMemo(() => {
    if (!todayRecord) {
      return { status: 'No entry yet', total: 0, office: 0, wfh: 0 };
    }
    return {
      status: todayRecord.late ? 'Late arrival' : 'On track',
      total: todayRecord.totalHours,
      office: todayRecord.officeHours,
      wfh: todayRecord.wfhHours,
    };
  }, [todayRecord]);

  const recentRecords = monthStats.monthRecords.slice(-14);

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Today</p>
        <h2 className="page-title mt-1">{formatDisplayDate(today)}</h2>
      </div>

      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-secondary">Status</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{todayStats.status}</p>
          </div>
          <Link to="/entry" className="btn-primary px-4 py-2 text-sm">
            {todayRecord ? 'Edit' : 'Log Time'}
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Hours"
          value={formatMinutesAsDuration(todayStats.total * 60)}
          hint="Today"
        />
        <StatCard
          label="Office Hours"
          value={formatMinutesAsDuration(todayStats.office * 60)}
          hint="Today"
        />
        <StatCard
          label="WFH Hours"
          value={formatMinutesAsDuration(todayStats.wfh * 60)}
          hint="Today"
        />
        <StatCard
          label="Target"
          value={formatMinutesAsDuration(settings?.targetHoursMinutes ?? 555)}
          hint="Daily goal"
        />
      </div>

      <Card title="Monthly Attendance" subtitle={format(new Date(), 'MMMM yyyy')}>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tracking-tight text-accent">
              {monthStats.attendancePct}%
            </p>
            <p className="text-sm text-text-secondary">of required office days</p>
          </div>
          <div className="text-right text-sm text-text-secondary">
            <p>
              <span className="font-semibold text-text-primary">{monthStats.officeDays}</span> /{' '}
              {monthStats.required} days
            </p>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${monthStats.attendancePct}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatCard
            label="Office Days Done"
            value={String(monthStats.officeDays)}
            accent="success"
          />
          <StatCard
            label="Remaining"
            value={String(monthStats.remaining)}
            accent={monthStats.remaining > 0 ? 'warning' : 'success'}
          />
          <StatCard
            label="Late Arrivals"
            value={String(monthStats.lateCount)}
            accent={monthStats.lateCount > 0 ? 'danger' : 'success'}
          />
          <StatCard
            label="Entries This Month"
            value={String(monthStats.monthRecords.length)}
          />
        </div>
      </Card>

      <Card title="Hours Trend" subtitle="Last 14 office days">
        <HoursChart records={recentRecords} />
      </Card>
    </div>
  );
}
