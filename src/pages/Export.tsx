import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { getAllRecords, importRecords, saveSettings } from '@/db';
import { useAllRecords, useSettings } from '@/hooks/useRecords';
import {
  downloadFile,
  parseImportJson,
  recordsToCsv,
  recordsToJson,
} from '@/utils/export';
import { format } from 'date-fns';

export function ExportPage() {
  const records = useAllRecords() ?? [];
  const settings = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const stamp = format(new Date(), 'yyyy-MM-dd');

  const exportCsv = async () => {
    const all = await getAllRecords();
    const csv = recordsToCsv(all);
    downloadFile(csv, `office-time-${stamp}.csv`, 'text/csv;charset=utf-8');
    setMessage(`Exported ${all.length} records as CSV.`);
  };

  const exportJson = async () => {
    const all = await getAllRecords();
    const json = recordsToJson(all, settings ?? undefined);
    downloadFile(json, `office-time-backup-${stamp}.json`, 'application/json');
    setMessage(`Exported ${all.length} records as JSON.`);
  };

  const handleImport = async (file: File) => {
    setError('');
    setMessage('');
    try {
      const text = await file.text();
      const bundle = parseImportJson(text);
      await importRecords(bundle.records);
      if (bundle.settings) {
        await saveSettings(bundle.settings);
      }
      setMessage(`Imported ${bundle.records.length} records successfully.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <p className="section-title">Export</p>
        <h2 className="page-title mt-1">Data Management</h2>
      </div>

      <Card title="Export Data" subtitle={`${records.length} records stored locally`}>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={exportCsv} className="btn-primary">
            Export CSV
          </button>
          <button type="button" onClick={exportJson} className="btn-secondary">
            Export JSON
          </button>
        </div>
      </Card>

      <Card title="Import Backup" subtitle="JSON backup files only">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-secondary w-full"
        >
          Import JSON
        </button>
        <p className="mt-2 text-xs text-text-muted">
          Import merges records by ID. Existing records with the same ID will be updated.
        </p>
      </Card>

      {message && (
        <p className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success">{message}</p>
      )}
      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
