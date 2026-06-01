import { useEffect, useMemo, useState } from 'react';
import { AttendanceActions } from '@/components/attendance/AttendanceActions';
import { PunchSection } from '@/components/attendance/PunchSection';
import { PunchTimeModal } from '@/components/attendance/PunchTimeModal';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { DateSelector } from '@/components/attendance/DateSelector';
import { DayTimeline } from '@/components/attendance/DayTimeline';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import {
  recordPunchIn,
  updatePunchIn,
  updatePunchOut,
  useRecordByDate,
  useSettings,
} from '@/hooks/useRecords';
import { buildTimeline, getDisplayStatus } from '@/utils/attendance';
import { resolveDayType } from '@/utils/recordHelpers';
import {
  formatDurationFromHours,
  formatTime24h,
  hasValidPunchTime,
} from '@/utils/time';
import { WFH_DAY_END, WFH_DAY_START } from '@/types';

type EditField = 'in' | 'out' | null;

export function DailyEntry() {
  const settings = useSettings();
  const {
    selectedDate: date,
    isToday,
    setSelectedDate,
    goToPreviousDay,
    goToToday,
    goToNextDay,
  } = useSelectedDate();

  const record = useRecordByDate(date);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editField, setEditField] = useState<EditField>(null);
  const [editTime, setEditTime] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayStatus = getDisplayStatus(record);
  const dayType = record ? resolveDayType(record) : null;
  const isOfficeDay = !dayType || dayType === 'OFFICE';
  const hasPunchIn = hasValidPunchTime(record?.punchIn);
  const hasPunchOut =
    record?.status === 'complete' && hasValidPunchTime(record?.punchOut);
  const timeline = settings ? buildTimeline(record, settings) : [];

  const workedDuration = useMemo(() => {
    if (!hasPunchIn || !hasPunchOut || !record) return null;
    return formatDurationFromHours(record.officeHours);
  }, [hasPunchIn, hasPunchOut, record]);

  const punchOutBadge = useMemo((): 'In Progress' | 'Completed' | null => {
    if (!hasPunchIn) return null;
    return hasPunchOut ? 'Completed' : 'In Progress';
  }, [hasPunchIn, hasPunchOut]);

  useEffect(() => {
    setEditField(null);
    setError('');
    setToastMessage(null);
  }, [date]);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => setToastMessage(null), 5000);
    return () => window.clearTimeout(id);
  }, [toastMessage]);

  const run = async (action: () => Promise<unknown>) => {
    if (!settings) return;
    setError('');
    setLoading(true);
    try {
      await action();
      setEditField(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchIn = () => run(() => recordPunchIn(date, settings!));

  const openTimeModal = (field: 'in' | 'out') => {
    if (!record && field === 'out') return;
    const initial =
      field === 'in'
        ? record?.punchIn ?? ''
        : record?.punchOut ?? '';
    setEditField(field);
    setEditTime(initial);
    setError('');
  };

  const closeTimeModal = () => {
    if (loading) return;
    setEditField(null);
  };

  const saveTimeModal = async (time: string) => {
    if (!settings || !editField || !time) return;
    await run(() =>
      editField === 'in'
        ? updatePunchIn(date, time, settings)
        : updatePunchOut(date, time, settings),
    );
  };

  const timeModalTitle =
    editField === 'in'
      ? hasPunchIn
        ? 'Edit Punch In'
        : 'Set Punch In'
      : hasPunchOut
        ? 'Edit Punch Out'
        : 'Set Punch Out Time';

  const timeModalSubtitle =
    editField === 'out' && !hasPunchOut
      ? 'Select when you left the office for this date.'
      : undefined;

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Daily Entry</p>
        <h2 className="page-title mt-1">Punch Clock</h2>
      </div>

      <Card>
        <DateSelector
          selectedDate={date}
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

      {error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {isOfficeDay && (
        <div className="space-y-3">
          <PunchSection
            title="Punch In"
            subtitle="Records arrival at the office"
            time={hasPunchIn ? record!.punchIn : undefined}
            canEdit={hasPunchIn}
            onEdit={() => openTimeModal('in')}
            primaryButton={
              !hasPunchIn
                ? {
                    label: 'Punch In',
                    hint: 'Tap to capture now',
                    className: 'btn-punch-in',
                    disabled: loading || !settings,
                    onClick: handlePunchIn,
                  }
                : undefined
            }
          />

          <PunchSection
            title="Punch Out"
            subtitle="Completes your day and calculates hours"
            time={hasPunchOut ? record!.punchOut : undefined}
            workedDuration={workedDuration}
            completionBadge={punchOutBadge}
            canSetTime={hasPunchIn && !hasPunchOut}
            setTimeLabel="Set Punch Out Time"
            onSetTime={() => openTimeModal('out')}
            canEdit={hasPunchOut}
            onEdit={() => openTimeModal('out')}
          />
        </div>
      )}

      {dayType === 'WFH' && record && (
        <Card title="Work From Home" subtitle="Full-day WFH entry">
          <div className="space-y-2 font-mono text-sm">
            <p>
              <span className="text-text-muted">WFH </span>
              {formatTime24h(record.wfh1Start || WFH_DAY_START)} –{' '}
              {formatTime24h(record.wfh1End || WFH_DAY_END)}
            </p>
            <p className="text-lg font-bold text-accent">
              Total {formatDurationFromHours(record.totalHours)}
            </p>
          </div>
        </Card>
      )}

      {dayType === 'LEAVE' && (
        <Card title="Leave" subtitle="No working hours recorded">
          <p className="text-sm text-text-secondary">Marked as leave for this date.</p>
        </Card>
      )}

      {dayType === 'HOLIDAY' && (
        <Card title="Holiday" subtitle="No working hours recorded">
          <p className="text-sm text-text-secondary">Marked as holiday for this date.</p>
        </Card>
      )}

      {record && settings && (
        <Card
          title="Timeline"
          subtitle={displayStatus === 'Completed' ? 'Full schedule' : 'In progress'}
        >
          <DayTimeline steps={timeline} />
        </Card>
      )}

      {record?.status === 'complete' &&
        (hasPunchOut || dayType === 'WFH') && (
          <Card title="Summary" subtitle="Hours for this date">
            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryCell
                label="Office"
                value={formatDurationFromHours(record.officeHours)}
              />
              <SummaryCell label="WFH" value={formatDurationFromHours(record.wfhHours)} />
              <SummaryCell
                label="Total"
                value={formatDurationFromHours(record.totalHours)}
                highlight
              />
            </div>
          </Card>
        )}

      <AttendanceActions
        variant="punch"
        date={date}
        onResetSuccess={setToastMessage}
      />

      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      <PunchTimeModal
        open={editField !== null}
        title={timeModalTitle}
        subtitle={timeModalSubtitle}
        initialTime={editTime}
        saving={loading}
        onClose={closeTimeModal}
        onSave={saveTimeModal}
      />
    </div>
  );
}

function SummaryCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`font-mono font-semibold tabular-nums ${highlight ? 'text-accent' : 'text-text-primary'}`}
      >
        {value}
      </p>
    </div>
  );
}
