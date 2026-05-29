import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { upsertDailyEntry, useSettings, useTodayRecord } from '@/hooks/useRecords';
import { computeAttendance } from '@/utils/calculations';
import {
  formatDisplayDate,
  formatMinutesAsDuration,
  formatTime12h,
  todayDateString,
} from '@/utils/time';
import type { ComputedTimes } from '@/types';

export function DailyEntry() {
  const settings = useSettings();
  const todayRecord = useTodayRecord();
  const [date, setDate] = useState(todayDateString());
  const [punchIn, setPunchIn] = useState('09:00');
  const [punchOut, setPunchOut] = useState('18:00');
  const [computed, setComputed] = useState<ComputedTimes | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (todayRecord && date === todayDateString()) {
      setPunchIn(todayRecord.punchIn);
      setPunchOut(todayRecord.punchOut);
      setComputed({
        wfh1Start: todayRecord.wfh1Start,
        wfh1End: todayRecord.wfh1End,
        wfh2Start: todayRecord.wfh2Start,
        wfh2End: todayRecord.wfh2End,
        officeHours: todayRecord.officeHours,
        wfhHours: todayRecord.wfhHours,
        totalHours: todayRecord.totalHours,
        late: todayRecord.late,
      });
    }
  }, [todayRecord, date]);

  const loadToday = () => {
    setDate(todayDateString());
    if (todayRecord) {
      setPunchIn(todayRecord.punchIn);
      setPunchOut(todayRecord.punchOut);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setError('');
    setLoading(true);
    try {
      const result = await upsertDailyEntry(date, punchIn, punchOut, settings);
      setComputed({
        wfh1Start: result.wfh1Start,
        wfh1End: result.wfh1End,
        wfh2Start: result.wfh2Start,
        wfh2End: result.wfh2End,
        officeHours: result.officeHours,
        wfhHours: result.wfhHours,
        totalHours: result.totalHours,
        late: result.late,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save entry.');
    } finally {
      setLoading(false);
    }
  };

  const preview = () => {
    if (!settings || !punchIn || !punchOut) return;
    try {
      setComputed(computeAttendance(date, punchIn, punchOut, settings));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid times.');
      setComputed(null);
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Daily Entry</p>
        <h2 className="page-title mt-1">Log Attendance</h2>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Punch In
              </label>
              <input
                type="time"
                className="input-field"
                value={punchIn}
                onChange={(e) => setPunchIn(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                Punch Out
              </label>
              <input
                type="time"
                className="input-field"
                value={punchOut}
                onChange={(e) => setPunchOut(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading || !settings}
              className="btn-primary flex-1"
            >
              {loading ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
            </button>
            <button type="button" onClick={loadToday} className="btn-secondary flex-1">
              Edit Today
            </button>
          </div>

          <button type="button" onClick={preview} className="w-full text-sm text-accent">
            Preview calculations
          </button>
        </div>
      </Card>

      {computed && (
        <Card title="Calculated Schedule" subtitle="Auto-computed from your punches">
          <div className="space-y-3">
            <TimeRow label="WFH Block 1" start={computed.wfh1Start} end={computed.wfh1End} />
            <TimeRow label="Office" start={punchIn} end={punchOut} highlight />
            <TimeRow label="WFH Block 2" start={computed.wfh2Start} end={computed.wfh2End} />

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
              <div>
                <p className="text-xs text-text-muted">Office</p>
                <p className="font-semibold">{formatMinutesAsDuration(computed.officeHours * 60)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">WFH</p>
                <p className="font-semibold">{formatMinutesAsDuration(computed.wfhHours * 60)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">Total</p>
                <p className="font-semibold text-accent">
                  {formatMinutesAsDuration(computed.totalHours * 60)}
                </p>
              </div>
            </div>

            {computed.late && (
              <p className="rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">
                Late arrival — punch in after official start (
                {settings && formatTime12h(settings.officialStartTime)})
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function TimeRow({
  label,
  start,
  end,
  highlight,
}: {
  label: string;
  start: string;
  end: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
        highlight ? 'bg-accent-muted' : 'bg-surface-muted'
      }`}
    >
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text-primary">
        {formatTime12h(start)} – {formatTime12h(end)}
      </span>
    </div>
  );
}
