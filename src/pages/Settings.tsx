import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { saveSettings } from '@/db';
import { useSettings } from '@/hooks/useRecords';
import { formatDurationInput, parseDurationInput } from '@/utils/calculations';
import type { AppSettings } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

export function SettingsPage() {
  const stored = useSettings();
  const [form, setForm] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [targetInput, setTargetInput] = useState('9h 15m');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (stored) {
      setForm(stored);
      setTargetInput(formatDurationInput(stored.targetHoursMinutes));
    }
  }, [stored]);

  const handleSave = async () => {
    setError('');
    try {
      const targetHoursMinutes = parseDurationInput(targetInput);
      if (targetHoursMinutes <= 0) throw new Error('Target hours must be greater than zero.');
      const updated: AppSettings = { ...form, targetHoursMinutes, id: 'settings' };
      await saveSettings(updated);
      setForm(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings.');
    }
  };

  const resetDefaults = () => {
    setForm(DEFAULT_SETTINGS);
    setTargetInput('9h 15m');
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Settings</p>
        <h2 className="page-title mt-1">Preferences</h2>
      </div>

      <Card>
        <div className="space-y-4">
          <Field
            label="Target Hours"
            hint="e.g. 9h 15m or 9:15"
            value={targetInput}
            onChange={setTargetInput}
          />
          <Field
            label="Office Days Required / Month"
            type="number"
            value={String(form.officeDaysRequiredPerMonth)}
            onChange={(v) =>
              setForm({ ...form, officeDaysRequiredPerMonth: parseInt(v, 10) || 0 })
            }
          />
          <Field
            label="Official Start Time"
            type="time"
            value={form.officialStartTime}
            onChange={(v) => setForm({ ...form, officialStartTime: v })}
          />
          <Field
            label="Gap Before Office (minutes)"
            type="number"
            value={String(form.gapBeforeOfficeMinutes)}
            onChange={(v) => setForm({ ...form, gapBeforeOfficeMinutes: parseInt(v, 10) || 0 })}
          />
          <Field
            label="Gap After Office (minutes)"
            type="number"
            value={String(form.gapAfterOfficeMinutes)}
            onChange={(v) => setForm({ ...form, gapAfterOfficeMinutes: parseInt(v, 10) || 0 })}
          />

          {error && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <div className="flex flex-col gap-2">
            <button type="button" onClick={handleSave} className="btn-primary">
              {saved ? 'Saved ✓' : 'Save Settings'}
            </button>
            <button type="button" onClick={resetDefaults} className="btn-secondary">
              Reset to Defaults
            </button>
          </div>
        </div>
      </Card>

      <Card title="Data & Export">
        <p className="mb-3 text-sm text-text-secondary">
          Export your attendance data or import a previous backup.
        </p>
        <Link to="/export" className="btn-primary inline-flex w-full">
          Export / Import
        </Link>
      </Card>

      <Card title="About">
        <p className="text-sm text-text-secondary">
          All data is stored locally in IndexedDB on your device. The app works fully offline after
          the first load. Times use your device&apos;s local timezone.
        </p>
      </Card>
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-text-secondary">{label}</label>
      <input
        type={type}
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}
