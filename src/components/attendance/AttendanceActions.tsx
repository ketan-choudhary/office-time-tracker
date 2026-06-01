import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { LeaveHolidayModal } from '@/components/attendance/LeaveHolidayModal';
import { ResetDayModal } from '@/components/attendance/ResetDayModal';
import {
  recordLeaveOrHoliday,
  recordWorkFromHome,
  resetAttendanceForDate,
  useRecordByDate,
} from '@/hooks/useRecords';
import { getDisplayStatus } from '@/utils/attendance';
import { hasAttendanceRecord } from '@/utils/recordHelpers';
import { formatDisplayDate, formatLongDate } from '@/utils/time';

interface AttendanceActionsProps {
  date: string;
  entryPath?: string;
  variant?: 'dashboard' | 'punch';
  onResetSuccess?: (message: string) => void;
}

export function AttendanceActions({
  date,
  entryPath,
  variant = 'dashboard',
  onResetSuccess,
}: AttendanceActionsProps) {
  const record = useRecordByDate(date);
  const displayStatus = getDisplayStatus(record);
  const hasRecord = hasAttendanceRecord(record);
  const isPunchPage = variant === 'punch';

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [wfhConfirmOpen, setWfhConfirmOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [holidayConfirmOpen, setHolidayConfirmOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const punchLabel =
    displayStatus === 'Not Started'
      ? 'Punch In'
      : displayStatus === 'In Progress'
        ? 'Punch Out'
        : 'View Entry';

  const run = async (action: () => Promise<unknown>) => {
    setError('');
    setLoading(true);
    try {
      await action();
      setWfhConfirmOpen(false);
      setLeaveConfirmOpen(false);
      setHolidayConfirmOpen(false);
      setLeaveModalOpen(false);
      setResetModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () =>
    run(async () => {
      await resetAttendanceForDate(date);
      onResetSuccess?.(`Attendance for ${formatLongDate(date)} has been cleared.`);
    });

  return (
    <>
      <Card
        title="Attendance Actions"
        subtitle={
          isPunchPage
            ? `Mark ${formatDisplayDate(date)}`
            : `Mark ${formatDisplayDate(date)} or open punch clock`
        }
      >
        <div className="space-y-3">
          {!isPunchPage && entryPath && (
            <Link
              to={entryPath}
              className="btn-punch-in flex w-full justify-center"
              aria-disabled={loading}
            >
              <span>{punchLabel}</span>
              <span className="text-sm font-normal opacity-90">Office punch clock</span>
            </Link>
          )}

          <button
            type="button"
            className={
              isPunchPage ? 'btn-punch-wfh w-full disabled:opacity-40' : 'btn-punch-wfh w-full disabled:opacity-40'
            }
            disabled={loading || hasRecord}
            onClick={() => setWfhConfirmOpen(true)}
          >
            <span>Work From Home</span>
            {!isPunchPage && (
              <span className="text-sm font-normal opacity-90">09:00 – 18:15 · 09:15 total</span>
            )}
          </button>

          {isPunchPage ? (
            <>
              <button
                type="button"
                className="btn-secondary min-h-[56px] w-full text-base"
                disabled={loading || hasRecord}
                onClick={() => setLeaveConfirmOpen(true)}
              >
                Leave
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[56px] w-full text-base"
                disabled={loading || hasRecord}
                onClick={() => setHolidayConfirmOpen(true)}
              >
                Holiday
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-secondary min-h-[56px] w-full text-base"
              disabled={loading || hasRecord}
              onClick={() => setLeaveModalOpen(true)}
            >
              Leave / Holiday
            </button>
          )}

          {hasRecord && !isPunchPage && (
            <p className="text-center text-xs text-text-muted">
              This date already has an attendance entry. Open punch clock to edit times.
            </p>
          )}

          {hasRecord && isPunchPage && (
            <p className="text-center text-xs text-text-muted">
              This date already has an attendance entry. Use Reset below to clear it.
            </p>
          )}

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>
      </Card>

      {isPunchPage && (
        <Card
          title="Danger Zone"
          subtitle="Remove all data for this date only"
          className="border-danger/30"
        >
          <button
            type="button"
            className="btn-reset-day"
            disabled={loading || !hasRecord}
            onClick={() => setResetModalOpen(true)}
          >
            <TrashIcon />
            Reset This Day
          </button>
        </Card>
      )}

      {wfhConfirmOpen && (
        <ConfirmDialog
          title="Mark as Work From Home?"
          message={`Creates a completed entry for ${formatDisplayDate(date)}: 09:00–18:15 (09:15 total).`}
          loading={loading}
          onClose={() => !loading && setWfhConfirmOpen(false)}
          onConfirm={() => run(() => recordWorkFromHome(date))}
        />
      )}

      {leaveConfirmOpen && (
        <ConfirmDialog
          title="Mark as Leave?"
          message={`Marks ${formatDisplayDate(date)} as leave with no working hours.`}
          loading={loading}
          onClose={() => !loading && setLeaveConfirmOpen(false)}
          onConfirm={() => run(() => recordLeaveOrHoliday(date, 'LEAVE'))}
        />
      )}

      {holidayConfirmOpen && (
        <ConfirmDialog
          title="Mark as Holiday?"
          message={`Marks ${formatDisplayDate(date)} as holiday with no working hours.`}
          loading={loading}
          onClose={() => !loading && setHolidayConfirmOpen(false)}
          onConfirm={() => run(() => recordLeaveOrHoliday(date, 'HOLIDAY'))}
        />
      )}

      <LeaveHolidayModal
        open={leaveModalOpen}
        saving={loading}
        onClose={() => !loading && setLeaveModalOpen(false)}
        onSave={(dayType) => run(() => recordLeaveOrHoliday(date, dayType))}
      />

      <ResetDayModal
        open={resetModalOpen}
        date={date}
        saving={loading}
        onClose={() => !loading && setResetModalOpen(false)}
        onConfirm={handleReset}
      />
    </>
  );
}

function ConfirmDialog({
  title,
  message,
  loading,
  onClose,
  onConfirm,
}: {
  title: string;
  message: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="card w-full max-w-md animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <p className="text-lg font-bold text-text-primary">{title}</p>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
        <div className="mt-5 flex gap-2">
          <button type="button" className="btn-secondary flex-1" disabled={loading} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary flex-1" disabled={loading} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
