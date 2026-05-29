import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { DayTimeline } from '@/components/attendance/DayTimeline';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import {
  recordPunchIn,
  recordPunchOut,
  updatePunchIn,
  updatePunchOut,
  useRecordByDate,
  useSettings,
} from '@/hooks/useRecords';
import { buildTimeline, getDayStatus } from '@/utils/attendance';
import { formatDisplayDate, formatTime12h, todayDateString } from '@/utils/time';

type EditField = 'in' | 'out' | null;

export function DailyEntry() {
  const settings = useSettings();
  const [date, setDate] = useState(todayDateString());
  const record = useRecordByDate(date);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editField, setEditField] = useState<EditField>(null);
  const [editTime, setEditTime] = useState('');

  const status = getDayStatus(record);
  const hasPunchIn = Boolean(record?.punchIn);
  const hasPunchOut = Boolean(record?.punchOut);
  const timeline = settings ? buildTimeline(record, settings) : [];

  useEffect(() => {
    setEditField(null);
    setError('');
  }, [date]);

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

  const goToday = () => setDate(todayDateString());

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-title">Daily Entry</p>
          <h2 className="page-title mt-1">Punch Clock</h2>
        </div>
        <StatusBadge status={status} />
      </div>

      <Card>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Date</label>
            <input
              type="date"
              className="input-field"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-text-muted">{formatDisplayDate(date)}</p>
          </div>
          {date !== todayDateString() && (
            <button type="button" onClick={goToday} className="btn-secondary w-full">
              Jump to Today
            </button>
          )}
        </div>
      </Card>

      {error && (
        <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <PunchSection
          title="Punch In"
          subtitle="Records your arrival at the office"
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

      {record?.punchIn && settings && (
        <Card title="Today's Timeline" subtitle={status === 'Completed' ? 'Full schedule' : 'In progress'}>
          <DayTimeline steps={timeline} />
        </Card>
      )}

      {record?.status === 'complete' && record.punchOut && (
        <Card title="Summary" subtitle="Calculated after punch out">
          <div className="grid grid-cols-3 gap-3 text-center">
            <SummaryCell label="Office" value={`${record.officeHours.toFixed(1)}h`} />
            <SummaryCell label="WFH" value={`${record.wfhHours.toFixed(1)}h`} />
            <SummaryCell label="Total" value={`${record.totalHours.toFixed(1)}h`} highlight />
          </div>
        </Card>
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
              {formatTime12h(time)}
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
      <p className={`font-semibold ${highlight ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}
