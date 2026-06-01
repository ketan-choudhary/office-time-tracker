import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { AttendanceActions } from '@/components/attendance/AttendanceActions';
import { DateSelector } from '@/components/attendance/DateSelector';
import { DayProgressRing } from '@/components/attendance/DayProgressRing';
import { DayTimeline } from '@/components/attendance/DayTimeline';
import { OfficeDaysComplianceWidget } from '@/components/attendance/OfficeDaysComplianceWidget';
import { OfficeHoursProgressRing } from '@/components/attendance/OfficeHoursProgressRing';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import { WFHTomorrowCard } from '@/components/attendance/WFHTomorrowCard';
import { WFHUsageWidget } from '@/components/attendance/WFHUsageWidget';
import { WorkingDaysDetails } from '@/components/attendance/WorkingDaysDetails';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { HoursChart } from '@/components/charts/HoursChart';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import { useAllRecords, useRecordByDate, useSettings } from '@/hooks/useRecords';
import {
  buildTimeline,
  getDayProgress,
  getDisplayStatus,
  getOfficeHoursProgress,
} from '@/utils/attendance';
import { evaluateWFHTomorrow, getMonthComplianceSnapshot } from '@/utils/compliance';
import { resolveDayType } from '@/utils/recordHelpers';
import {
  formatDisplayDate,
  formatDurationFromHours,
  formatDurationHHMM,
} from '@/utils/time';

export function Dashboard() {
  const records = useAllRecords() ?? [];
  const settings = useSettings();
  const {
    selectedDate,
    isToday,
    setSelectedDate,
    goToToday,
    goToPreviousDay,
    goToNextDay,
    entryPath,
  } = useSelectedDate();

  const selectedRecord = useRecordByDate(selectedDate);
  const displayStatus = getDisplayStatus(selectedRecord);
  const isLiveDay = isToday;

  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    if (!isLiveDay || displayStatus !== 'In Progress') return;
    const id = window.setInterval(() => setProgressTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [isLiveDay, displayStatus]);

  const progressOptions = useMemo(
    () => ({ live: isLiveDay && displayStatus === 'In Progress' }),
    [isLiveDay, displayStatus],
  );

  const timeline = useMemo(
    () => (settings ? buildTimeline(selectedRecord, settings) : []),
    [selectedRecord, settings],
  );

  const dayProgress = useMemo(
    () =>
      settings
        ? getDayProgress(selectedRecord, settings, progressOptions)
        : { currentMinutes: 0, targetMinutes: 555, percent: 0 },
    [selectedRecord, settings, progressOptions, progressTick],
  );

  const officeProgress = useMemo(() => {
    void progressTick;
    return getOfficeHoursProgress(selectedRecord, progressOptions);
  }, [selectedRecord, progressOptions, progressTick]);

  const complianceMonth = useMemo(() => parseISO(selectedDate), [selectedDate]);

  const compliance = useMemo(
    () => getMonthComplianceSnapshot(records, complianceMonth, settings),
    [records, complianceMonth, settings],
  );

  const wfhVerdict = useMemo(
    () => evaluateWFHTomorrow(records, new Date(), settings),
    [records, settings],
  );

  const dayHours = useMemo(() => {
    if (!selectedRecord) {
      return { total: 0, office: 0, wfh: 0 };
    }
    if (
      resolveDayType(selectedRecord) === 'LEAVE' ||
      resolveDayType(selectedRecord) === 'HOLIDAY'
    ) {
      return { total: 0, office: 0, wfh: 0 };
    }
    return {
      total: selectedRecord.totalHours,
      office: selectedRecord.officeHours,
      wfh: selectedRecord.wfhHours,
    };
  }, [selectedRecord]);

  const recentOfficeRecords = useMemo(() => {
    const ref = complianceMonth;
    const start = format(new Date(ref.getFullYear(), ref.getMonth(), 1), 'yyyy-MM-dd');
    const end = format(new Date(ref.getFullYear(), ref.getMonth() + 1, 0), 'yyyy-MM-dd');
    const monthRecords = records.filter(
      (r) => r.date >= start && r.date <= end && resolveDayType(r) === 'OFFICE',
    );
    return monthRecords.slice(-14);
  }, [records, complianceMonth]);

  const targetMinutes = settings?.targetHoursMinutes ?? 9 * 60 + 15;
  const dateHint = isToday ? 'Selected day' : formatDisplayDate(selectedDate);

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Attendance</p>
        <h2 className="page-title mt-1">Dashboard</h2>
      </div>

      <Card>
        <DateSelector
          selectedDate={selectedDate}
          isToday={isToday}
          onDateChange={setSelectedDate}
          onPreviousDay={goToPreviousDay}
          onToday={goToToday}
          onNextDay={goToNextDay}
        />
      </Card>

      <div className="flex items-center justify-end">
        <StatusBadge status={displayStatus} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-accent/20 bg-gradient-to-br from-accent/5 via-surface-elevated to-surface-elevated">
          <DayProgressRing progress={dayProgress} />
        </Card>
        <Card className="border-border bg-surface-elevated">
          <OfficeHoursProgressRing progress={officeProgress} />
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <OfficeDaysComplianceWidget
          snapshot={compliance}
          subtitle={format(complianceMonth, 'MMMM yyyy')}
        />
        <WFHUsageWidget snapshot={compliance} subtitle={format(complianceMonth, 'MMMM yyyy')} />
      </div>

      <WorkingDaysDetails
        breakdown={compliance}
        officeDaysRequired={compliance.officeDaysRequired}
        subtitle={format(complianceMonth, 'MMMM yyyy')}
      />

      <AttendanceActions date={selectedDate} entryPath={entryPath} />

      <Card title="Timeline" subtitle={formatDisplayDate(selectedDate)}>
        <DayTimeline steps={timeline} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Hours"
          value={formatDurationFromHours(dayHours.total)}
          hint={dateHint}
        />
        <StatCard
          label="Office Hours"
          value={formatDurationFromHours(dayHours.office)}
          hint={dateHint}
        />
        <StatCard
          label="WFH Hours"
          value={formatDurationFromHours(dayHours.wfh)}
          hint={dateHint}
        />
        <StatCard
          label="Target"
          value={formatDurationHHMM(targetMinutes)}
          hint="Daily goal"
        />
      </div>

      {isToday && <WFHTomorrowCard verdict={wfhVerdict} />}

      <Card title="Hours Trend" subtitle={`Last 14 office days · ${format(complianceMonth, 'MMM yyyy')}`}>
        <HoursChart records={recentOfficeRecords} />
      </Card>
    </div>
  );
}
