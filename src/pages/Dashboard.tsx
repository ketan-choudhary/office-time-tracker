import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DayProgressRing } from '@/components/attendance/DayProgressRing';
import { DayTimeline } from '@/components/attendance/DayTimeline';
import { OfficeHoursProgressRing } from '@/components/attendance/OfficeHoursProgressRing';
import { SkipOfficeCard } from '@/components/attendance/SkipOfficeCard';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { HoursChart } from '@/components/charts/HoursChart';
import { useAllRecords, useSettings, useTodayRecord } from '@/hooks/useRecords';
import {
  buildTimeline,
  getDayProgress,
  getDayStatus,
  getOfficeHoursProgress,
} from '@/utils/attendance';
import { evaluateSkipOfficeTomorrow } from '@/utils/compliance';
import { isOfficeDay } from '@/utils/calculations';
import {
  currentMonthRange,
  formatDisplayDate,
  formatDurationFromHours,
  formatDurationHHMM,
  todayDateString,
} from '@/utils/time';

export function Dashboard() {
  const records = useAllRecords() ?? [];
  const settings = useSettings();
  const todayRecord = useTodayRecord();
  const today = todayDateString();

  const dayStatus = getDayStatus(todayRecord);
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    if (dayStatus !== 'Working') return;
    const id = window.setInterval(() => setProgressTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [dayStatus]);

  const timeline = useMemo(
    () => (settings ? buildTimeline(todayRecord, settings) : []),
    [todayRecord, settings],
  );
  const dayProgress = useMemo(
    () =>
      settings
        ? getDayProgress(todayRecord, settings)
        : { currentMinutes: 0, targetMinutes: 555, percent: 0 },
    [todayRecord, settings, progressTick],
  );
  const officeProgress = useMemo(() => {
    void progressTick;
    return getOfficeHoursProgress(todayRecord);
  }, [todayRecord, progressTick]);

  const monthStats = useMemo(() => {
    const { start, end } = currentMonthRange();
    const monthRecords = records.filter((r) => r.date >= start && r.date <= end);
    const officeDays = monthRecords.filter(isOfficeDay).length;
    const required = settings?.officeDaysRequiredPerMonth ?? 10;
    const attendancePct =
      required > 0 ? Math.min(100, Math.round((officeDays / required) * 100)) : 0;

    return {
      monthRecords,
      officeDays,
      required,
      remaining: Math.max(0, required - officeDays),
      attendancePct,
    };
  }, [records, settings]);

  const skipVerdict = useMemo(
    () =>
      evaluateSkipOfficeTomorrow(
        monthStats.officeDays,
        monthStats.required,
      ),
    [monthStats.officeDays, monthStats.required],
  );

  const todayHours = useMemo(() => {
    if (!todayRecord?.punchIn) {
      return { total: 0, office: 0, wfh: 0 };
    }
    return {
      total: todayRecord.totalHours,
      office: todayRecord.officeHours,
      wfh: todayRecord.wfhHours,
    };
  }, [todayRecord]);

  const recentRecords = monthStats.monthRecords.slice(-14);
  const targetMinutes = settings?.targetHoursMinutes ?? 9 * 60 + 15;

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-title">Today</p>
          <h2 className="page-title mt-1">{formatDisplayDate(today)}</h2>
        </div>
        <StatusBadge status={dayStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 via-surface-elevated to-surface-elevated">
          <DayProgressRing progress={dayProgress} />
        </Card>
        <Card className="border-border bg-surface-elevated">
          <OfficeHoursProgressRing progress={officeProgress} />
        </Card>
      </div>

      <Link to="/entry" className="btn-primary flex w-full justify-center">
        {dayStatus === 'Not Started'
          ? 'Punch In'
          : dayStatus === 'Working'
            ? 'Punch Out'
            : 'View Entry'}
      </Link>

      <Card title="Today's Timeline">
        <DayTimeline steps={timeline} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Hours"
          value={formatDurationFromHours(todayHours.total)}
          hint="Today"
        />
        <StatCard
          label="Office Hours"
          value={formatDurationFromHours(todayHours.office)}
          hint="Today"
        />
        <StatCard
          label="WFH Hours"
          value={formatDurationFromHours(todayHours.wfh)}
          hint="Today"
        />
        <StatCard
          label="Target"
          value={formatDurationHHMM(targetMinutes)}
          hint="Daily goal"
        />
      </div>

      <Card title="Office Days Progress" subtitle={format(new Date(), 'MMMM yyyy')}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-4xl font-bold tracking-tight text-text-primary">
              {monthStats.officeDays}
              <span className="text-2xl font-semibold text-text-muted">
                {' '}
                / {monthStats.required}
              </span>
            </p>
            <p className="mt-1 text-sm text-text-secondary">Completed office days</p>
          </div>
          <div className="rounded-2xl bg-surface-muted px-4 py-3 text-right">
            <p className="text-2xl font-bold text-accent">{monthStats.remaining}</p>
            <p className="text-xs font-medium text-text-muted">Remaining</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${monthStats.attendancePct}%` }}
          />
        </div>
      </Card>

      <SkipOfficeCard verdict={skipVerdict} />

      <Card title="Monthly Attendance" subtitle={format(new Date(), 'MMMM yyyy')}>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tracking-tight text-accent">
              {monthStats.attendancePct}%
            </p>
            <p className="text-sm text-text-secondary">of required office days</p>
          </div>
        </div>
        <StatCard
          label="Entries This Month"
          value={String(monthStats.monthRecords.length)}
        />
      </Card>

      <Card title="Hours Trend" subtitle="Last 14 office days">
        <HoursChart records={recentRecords} />
      </Card>
    </div>
  );
}
