import { useEffect, useState } from 'react';
import { AttendanceActions } from '@/components/attendance/AttendanceActions';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { DateSelector } from '@/components/attendance/DateSelector';
import { DayTimeline } from '@/components/attendance/DayTimeline';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import { useSelectedDate } from '@/hooks/useSelectedDate';
import {
  recordPunchIn,
  recordPunchOut,
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
} from '@/utils/time';
import { WFH_DAY_END, WFH_DAY_START } from '@/types';

type EditField = 'in' | 'out' | null;

export function DailyEntry() {
  const settings = useSettings();
  const {
    selectedDate: date,
    isToday,
    setSelectedDate,
    goToToday,
    goToPreviousDay,
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
  const hasPunchIn = Boolean(record?.punchIn);
  const hasPunchOut = Boolean(record?.punchOut);
  const timeline = settings ? buildTimeline(record, settings) : [];

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
  const handlePunchOut = () => run(() => recordPunchOut(date, settings!));

  const startEdit = (field: 'in' | 'out') => {
    if (!record) return;
    setEditField(field);
    setEditTime(field === 'in' ? record.punchIn : record.punchOut);
    setError('');
  };

  const saveEdit = async () => {
    if (!settings || !editField || !editTime) return;
    await run(() =>
      editField === 'in'
        ? updatePunchIn(date, editTime, settings)
        : updatePunchOut(date, editTime, settings),
    );
  };

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
            time={record?.punchIn}
            disabled={loading || !settings || hasPunchIn}
            buttonLabel={hasPunchIn ? 'Punched In' : 'Punch In'}
            buttonClass="btn-punch-in"
            onPunch={handlePunchIn}
            canEdit={hasPunchIn}
            editing={editField === 'in'}
            editTime={editTime}
            onStartEdit={() => startEdit('in')}
            onEditTimeChange={setEditTime}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditField(null)}
          />

          <PunchSection
            title="Punch Out"
            subtitle="Completes your day and calculates hours"
            time={record?.punchOut}
            disabled={loading || !settings || !hasPunchIn || hasPunchOut}
            buttonLabel={hasPunchOut ? 'Punched Out' : 'Punch Out'}
            buttonClass="btn-punch-out"
            onPunch={handlePunchOut}
            canEdit={hasPunchOut}
            editing={editField === 'out'}
            editTime={editTime}
            onStartEdit={() => startEdit('out')}
            onEditTimeChange={setEditTime}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditField(null)}
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
    </div>
  );
}

function PunchSection({
  title,
  subtitle,
  time,
  disabled,
  buttonLabel,
  buttonClass,
  onPunch,
  canEdit,
  editing,
  editTime,
  onStartEdit,
  onEditTimeChange,
  onSaveEdit,
  onCancelEdit,
}: {
  title: string;
  subtitle: string;
  time?: string;
  disabled: boolean;
  buttonLabel: string;
  buttonClass: string;
  onPunch: () => void;
  canEdit: boolean;
  editing: boolean;
  editTime: string;
  onStartEdit: () => void;
  onEditTimeChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  return (
    <Card className="!p-4">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>

      {time && !editing && (
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-surface-muted px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Recorded</p>
            <p className="text-xl font-bold tracking-tight text-text-primary">
              {formatTime24h(time)}
            </p>
          </div>
          {canEdit && (
            <button type="button" className="btn-punch-edit" onClick={onStartEdit}>
              Edit
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <input
            type="time"
            className="input-field"
            value={editTime}
            onChange={(e) => onEditTimeChange(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={onSaveEdit}>
              Save
            </button>
            <button type="button" className="btn-secondary flex-1" onClick={onCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editing && (
        <button
          type="button"
          className={`${buttonClass} mt-4`}
          disabled={disabled}
          onClick={onPunch}
        >
          <span>{buttonLabel}</span>
          {!time && <span className="text-sm font-normal opacity-90">Tap to capture now</span>}
        </button>
      )}
    </Card>
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
